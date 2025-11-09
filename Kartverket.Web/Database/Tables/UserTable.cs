using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;

namespace Kartverket.Web.Database.Tables;

public class UserTable : IdentityUser<Guid>
{
    public required bool IsActive { get; set; }

    public Guid? RoleId { get; set; }
    public RoleTable? Role { get; set; }

    [JsonIgnore] public List<ReportFeedbackTable> ReportFeedbacks { get; set; }
    [JsonIgnore] public List<ReportTable> Reports { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
