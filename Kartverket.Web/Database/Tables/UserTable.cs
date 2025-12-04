using Microsoft.AspNetCore.Identity;
using System.Text.Json.Serialization;

namespace Kartverket.Web.Database.Tables;

public class UserTable : IdentityUser<Guid>
{
    public Guid? RoleId { get; set; }
    public RoleTable? Role { get; set; }

    [JsonIgnore] public List<ReportFeedbackTable> ReportFeedbacks { get; set; }
    [JsonIgnore] public List<ReportTable> Reports { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
