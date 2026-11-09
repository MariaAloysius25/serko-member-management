using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Serko.MemberManagement.Api.Models;

namespace Serko.MemberManagement.Api.Tests;

public sealed class MemberApiIntegrationTests
{
    [Fact]
    public async Task GetMembers_ReturnsEightFixedMembers()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/members");

        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<MemberListResponse>();

        Assert.NotNull(payload);
        Assert.Equal(8, payload.Items.Count);
    }

    [Fact]
    public async Task GetMembers_SearchIsCaseInsensitiveAcrossNamesAndEmail()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/members?search=CASEY");

        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<MemberListResponse>();

        Assert.NotNull(payload);
        Assert.Single(payload.Items);
        Assert.Equal("m7", payload.Items[0].Id);
        Assert.Equal("Casey", payload.Items[0].FirstName);

        var emailSearch = await client.GetAsync("/api/members?search=EXAMPLE.TEST");
        emailSearch.EnsureSuccessStatusCode();

        var emailPayload = await emailSearch.Content.ReadFromJsonAsync<MemberListResponse>();

        Assert.NotNull(emailPayload);
        Assert.Equal(8, emailPayload.Items.Count);
    }

    [Fact]
    public async Task GetMembers_FilterByRoleAndCombineWithSearch_UsesAndLogic()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var roleFilterResponse = await client.GetAsync("/api/members?role=traveller");
        roleFilterResponse.EnsureSuccessStatusCode();

        var roleFilterPayload = await roleFilterResponse.Content.ReadFromJsonAsync<MemberListResponse>();
        Assert.NotNull(roleFilterPayload);
        Assert.Equal(3, roleFilterPayload.Items.Count);
        Assert.All(roleFilterPayload.Items, member => Assert.Equal(Roles.Traveller, member.Role));

        var combinedResponse = await client.GetAsync("/api/members?search=alex&role=traveller");
        combinedResponse.EnsureSuccessStatusCode();

        var combinedPayload = await combinedResponse.Content.ReadFromJsonAsync<MemberListResponse>();
        Assert.NotNull(combinedPayload);
        Assert.Single(combinedPayload.Items);
        Assert.Equal("m1", combinedPayload.Items[0].Id);
    }

    [Fact]
    public async Task GetMembers_WithInvalidRoleFilter_ReturnsBadRequest()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/members?role=manager");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ApiErrorResponse>();
        Assert.NotNull(payload);
        Assert.Equal("INVALID_ROLE", payload.Error.Code);
        Assert.Equal("The supplied role is not supported.", payload.Error.Message);
    }

    [Fact]
    public async Task GetMemberById_UnknownMember_ReturnsNotFound()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/members/unknown");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ApiErrorResponse>();
        Assert.NotNull(payload);
        Assert.Equal("MEMBER_NOT_FOUND", payload.Error.Code);
    }

    [Fact]
    public async Task PatchMemberRole_UpdatesRoleOnSuccess()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PatchAsJsonAsync("/api/members/m1", new { role = Roles.Arranger });

        response.EnsureSuccessStatusCode();

        var updatedMember = await response.Content.ReadFromJsonAsync<Member>();
        Assert.NotNull(updatedMember);
        Assert.Equal(Roles.Arranger, updatedMember.Role);

        var retrievedMember = await client.GetFromJsonAsync<Member>("/api/members/m1");
        Assert.NotNull(retrievedMember);
        Assert.Equal(Roles.Arranger, retrievedMember.Role);
    }

    [Fact]
    public async Task PatchMemberRole_WithInvalidRoleOrExtraFields_ReturnsBadRequest()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var invalidRole = await client.PatchAsJsonAsync("/api/members/m1", new { role = "not-a-role" });
        Assert.Equal(HttpStatusCode.BadRequest, invalidRole.StatusCode);

        var extraField = await client.PatchAsJsonAsync("/api/members/m1", new { role = Roles.Traveller, extra = "nope" });
        Assert.Equal(HttpStatusCode.BadRequest, extraField.StatusCode);
    }

    [Fact]
    public async Task PatchMemberRole_WithEmptyObject_ReturnsBadRequestWithApiError()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PatchAsync(
            "/api/members/m1",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ApiErrorResponse>();
        Assert.NotNull(payload);
        Assert.Equal("INVALID_ROLE", payload.Error.Code);
        Assert.Equal("The supplied role is not supported.", payload.Error.Message);
    }

    [Fact]
    public async Task PatchMemberRole_WithNullRole_ReturnsBadRequestWithApiError()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PatchAsync(
            "/api/members/m1",
            new StringContent(
                """{"role": null}""",
                System.Text.Encoding.UTF8,
                "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ApiErrorResponse>();
        Assert.NotNull(payload);
        Assert.Equal("INVALID_ROLE", payload.Error.Code);
        Assert.Equal("The supplied role is not supported.", payload.Error.Message);
    }

    [Fact]
    public async Task PatchMemberRole_UnknownMember_ReturnsNotFound()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PatchAsJsonAsync("/api/members/does-not-exist", new { role = Roles.Traveller });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ApiErrorResponse>();
        Assert.NotNull(payload);
        Assert.Equal("MEMBER_NOT_FOUND", payload.Error.Code);
    }

    [Fact]
    public async Task PostFailNextSave_ArmsOneShotFailure_AndNextPatchReturns503BeforeMutation()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var armResponse = await client.PostAsync("/api/dev/fail-next-save", null);
        armResponse.EnsureSuccessStatusCode();

        var beforeFailure = await client.GetFromJsonAsync<Member>("/api/members/m1");
        Assert.NotNull(beforeFailure);
        Assert.Equal(Roles.Traveller, beforeFailure.Role);

        var failedSave = await client.PatchAsJsonAsync("/api/members/m1", new { role = Roles.Administrator });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, failedSave.StatusCode);

        var errorPayload = await failedSave.Content.ReadFromJsonAsync<ApiErrorResponse>();
        Assert.NotNull(errorPayload);
        Assert.Equal("SIMULATED_FAILURE", errorPayload.Error.Code);

        var afterFailure = await client.GetFromJsonAsync<Member>("/api/members/m1");
        Assert.NotNull(afterFailure);
        Assert.Equal(Roles.Traveller, afterFailure.Role);

        var retryResponse = await client.PatchAsJsonAsync("/api/members/m1", new { role = Roles.Administrator });
        retryResponse.EnsureSuccessStatusCode();

        var retryMember = await retryResponse.Content.ReadFromJsonAsync<Member>();
        Assert.NotNull(retryMember);
        Assert.Equal(Roles.Administrator, retryMember.Role);

        var finalMember = await client.GetFromJsonAsync<Member>("/api/members/m1");
        Assert.NotNull(finalMember);
        Assert.Equal(Roles.Administrator, finalMember.Role);
    }

    [Fact]
    public async Task DevFailEndpoint_IsNotAvailableOutsideDevelopment()
    {
        using var factory = new TestWebApplicationFactory("Production");
        using var client = factory.CreateClient();

        var response = await client.PostAsync("/api/dev/fail-next-save", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private sealed class TestWebApplicationFactory(string environment = "Development") : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment(environment);
        }
    }

    private sealed class MemberListResponse
    {
        public List<Member> Items { get; set; } = [];
    }
}
