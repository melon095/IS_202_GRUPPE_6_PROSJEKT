using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kartverket.Web.Migrations
{
    /// <inheritdoc />
    public partial class improved_object_type_2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Colour",
                table: "HindranceTypes",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "HindranceTypes",
                keyColumn: "Colour",
                keyValue: null,
                column: "Colour",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Colour",
                table: "HindranceTypes",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
