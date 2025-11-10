using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kartverket.Web.Migrations
{
    /// <inheritdoc />
    public partial class improved_object_type : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PrimaryImageUrl",
                table: "HindranceTypes",
                newName: "Colour");

            migrationBuilder.RenameColumn(
                name: "MarkerImageUrl",
                table: "HindranceTypes",
                newName: "ImageUrl");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "HindranceTypes",
                newName: "MarkerImageUrl");

            migrationBuilder.RenameColumn(
                name: "Colour",
                table: "HindranceTypes",
                newName: "PrimaryImageUrl");
        }
    }
}
