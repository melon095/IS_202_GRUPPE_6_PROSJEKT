using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kartverket.Web.Migrations
{
    /// <inheritdoc />
    public partial class hindrance_object_has_review_status : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Reports",
                newName: "ReviewStatus");

            migrationBuilder.AddColumn<int>(
                name: "ReviewStatus",
                table: "HindranceObjects",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewStatus",
                table: "HindranceObjects");

            migrationBuilder.RenameColumn(
                name: "ReviewStatus",
                table: "Reports",
                newName: "Status");
        }
    }
}
