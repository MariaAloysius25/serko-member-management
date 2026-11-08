namespace Serko.MemberManagement.Api.Models;

public sealed record UpdateRoleRequest
{
    public required string Role { get; init; }
}
