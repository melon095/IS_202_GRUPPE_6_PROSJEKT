using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kartverket.Web.Migrations
{
    /// <inheritdoc />
    public partial class fjerne_bounding_box : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxLatitude",
                table: "HindranceObjects");

            migrationBuilder.DropColumn(
                name: "MaxLongitude",
                table: "HindranceObjects");

            migrationBuilder.DropColumn(
                name: "MinLatitude",
                table: "HindranceObjects");

            migrationBuilder.DropColumn(
                name: "MinLongitude",
                table: "HindranceObjects");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "MaxLatitude",
                table: "HindranceObjects",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MaxLongitude",
                table: "HindranceObjects",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MinLatitude",
                table: "HindranceObjects",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MinLongitude",
                table: "HindranceObjects",
                type: "double",
                nullable: true);
        }
    }
}
