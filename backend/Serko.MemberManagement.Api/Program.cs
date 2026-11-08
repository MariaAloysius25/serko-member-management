using System.Text.Json;
using Serko.MemberManagement.Api.Data;
using Serko.MemberManagement.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJsDevelopment", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .WithMethods("GET", "PATCH", "POST")
            .WithHeaders("Content-Type");
    });
});
builder.Services.AddSingleton<InMemoryMemberStore>();

var app = builder.Build();

app.UseCors("NextJsDevelopment");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/members", (string? search, string? role, InMemoryMemberStore store) =>
{
    if (role is not null && !Roles.IsSupported(role))
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var normalizedSearch = string.IsNullOrWhiteSpace(search) ? null : search;
    var filteredMembers = store.GetAll()
        .Where(member =>
            (normalizedSearch is null ||
                member.FirstName.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                member.LastName.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                member.Email.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase)) &&
            (role is null || member.Role == role))
        .ToList();

    return Results.Ok(new { items = filteredMembers });
});

app.MapGet("/api/members/{id}", (string id, InMemoryMemberStore store) =>
{
    var member = store.GetById(id);
    if (member is null)
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "MEMBER_NOT_FOUND",
                    Message = "No member exists with the supplied ID."
                }
            },
            statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Ok(member);
});

app.MapPatch("/api/members/{id}", async (string id, HttpRequest request, InMemoryMemberStore store) =>
{
    if (!request.Body.CanRead)
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    string requestBody;
    using (var reader = new StreamReader(request.Body, leaveOpen: true))
    {
        requestBody = await reader.ReadToEndAsync();
    }

    if (string.IsNullOrWhiteSpace(requestBody))
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    JsonDocument document;
    try
    {
        document = JsonDocument.Parse(requestBody);
    }
    catch (JsonException)
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (document.RootElement.ValueKind != JsonValueKind.Object)
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var propertyNames = document.RootElement.EnumerateObject().Select(property => property.Name).ToList();
    if (propertyNames.Count != 1 || propertyNames[0] != "role")
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (!document.RootElement.TryGetProperty("role", out var roleProperty) || roleProperty.ValueKind != JsonValueKind.String)
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var requestedRole = roleProperty.GetString();
    if (requestedRole is null || !Roles.IsSupported(requestedRole))
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "INVALID_ROLE",
                    Message = "The supplied role is not supported."
                }
            },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var existingMember = store.GetById(id);
    if (existingMember is null)
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "MEMBER_NOT_FOUND",
                    Message = "No member exists with the supplied ID."
                }
            },
            statusCode: StatusCodes.Status404NotFound);
    }

    if (store.ConsumeFailNextSave())
    {
        return Results.Json(
            new ApiErrorResponse
            {
                Error = new ApiErrorDetail
                {
                    Code = "SIMULATED_FAILURE",
                    Message = "The simulated save failure was triggered. Please retry."
                }
            },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    var updatedMember = store.UpdateRole(id, requestedRole);
    return Results.Ok(updatedMember);
});

app.MapPost("/api/dev/fail-next-save", (IHostEnvironment environment, InMemoryMemberStore store) =>
{
    if (!environment.IsDevelopment())
    {
        return Results.NotFound();
    }

    store.ArmFailNextSave();
    return Results.Ok(new { armed = true });
});

app.Run();

public partial class Program
{
}
