using Serko.MemberManagement.Api.Models;

namespace Serko.MemberManagement.Api.Data;

public sealed class InMemoryMemberStore
{
    private readonly List<Member> _members;
    private readonly object _syncRoot = new();
    private bool _failNextSave;

    public InMemoryMemberStore()
    {
        _members =
        [
            new Member { Id = "m1", FirstName = "Alex", LastName = "River", Email = "alex@example.test", Role = Roles.Traveller },
            new Member { Id = "m2", FirstName = "Sam", LastName = "Brook", Email = "sam@example.test", Role = Roles.Arranger },
            new Member { Id = "m3", FirstName = "Lee", LastName = "Vale", Email = "lee@example.test", Role = Roles.Administrator },
            new Member { Id = "m4", FirstName = "Robin", LastName = "Lake", Email = "robin@example.test", Role = Roles.Traveller },
            new Member { Id = "m5", FirstName = "Alex", LastName = "Brook", Email = "alex.brook@example.test", Role = Roles.Arranger },
            new Member { Id = "m6", FirstName = "Sam", LastName = "Vale", Email = "sam.vale@example.test", Role = Roles.Administrator },
            new Member { Id = "m7", FirstName = "Casey", LastName = "River", Email = "casey@example.test", Role = Roles.Traveller },
            new Member { Id = "m8", FirstName = "Jordan", LastName = "Lake", Email = "jordan@example.test", Role = Roles.Arranger }
        ];
    }

    public IReadOnlyList<Member> GetAll()
    {
        lock (_syncRoot)
        {
            return _members.ToList();
        }
    }

    public Member? GetById(string id)
    {
        lock (_syncRoot)
        {
            return _members.FirstOrDefault(member => member.Id == id);
        }
    }

    public Member UpdateRole(string id, string newRole)
    {
        lock (_syncRoot)
        {
            var index = _members.FindIndex(member => member.Id == id);
            if (index < 0)
            {
                throw new InvalidOperationException($"Member with id '{id}' was not found.");
            }

            var updatedMember = _members[index] with { Role = newRole };
            _members[index] = updatedMember;
            return updatedMember;
        }
    }

    public void ArmFailNextSave()
    {
        lock (_syncRoot)
        {
            _failNextSave = true;
        }
    }

    public bool ConsumeFailNextSave()
    {
        lock (_syncRoot)
        {
            if (!_failNextSave)
            {
                return false;
            }

            _failNextSave = false;
            return true;
        }
    }
}
