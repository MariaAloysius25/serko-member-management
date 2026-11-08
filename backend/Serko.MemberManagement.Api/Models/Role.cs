namespace Serko.MemberManagement.Api.Models;

public static class Roles
{
    public const string Traveller = "traveller";
    public const string Arranger = "arranger";
    public const string Administrator = "administrator";

    public static readonly string[] SupportedRoles = [Traveller, Arranger, Administrator];

    public static bool IsSupported(string value)
    {
        return value is Traveller or Arranger or Administrator;
    }
}
