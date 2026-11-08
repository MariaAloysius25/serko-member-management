namespace Serko.MemberManagement.Api.Models;

public sealed record ApiErrorResponse
{
    public required ApiErrorDetail Error { get; init; }
}

public sealed record ApiErrorDetail
{
    public required string Code { get; init; }
    public required string Message { get; init; }
}
