using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kartverket.Web.Migrations
{
    /// <inheritdoc />
    public partial class bedre_fremmednoerkle_struktur_rapport_mapobject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MapPoints_Reports_ReportId",
                table: "MapPoints");

            migrationBuilder.DropIndex(
                name: "IX_MapPoints_ReportId",
                table: "MapPoints");

            migrationBuilder.DropColumn(
                name: "ReportId",
                table: "MapPoints");

            migrationBuilder.AddColumn<Guid>(
                name: "ReportId",
                table: "MapObjects",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_MapObjects_ReportId",
                table: "MapObjects",
                column: "ReportId");

            migrationBuilder.AddForeignKey(
                name: "FK_MapObjects_Reports_ReportId",
                table: "MapObjects",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MapObjects_Reports_ReportId",
                table: "MapObjects");

            migrationBuilder.DropIndex(
                name: "IX_MapObjects_ReportId",
                table: "MapObjects");

            migrationBuilder.DropColumn(
                name: "ReportId",
                table: "MapObjects");

            migrationBuilder.AddColumn<Guid>(
                name: "ReportId",
                table: "MapPoints",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_MapPoints_ReportId",
                table: "MapPoints",
                column: "ReportId");

            migrationBuilder.AddForeignKey(
                name: "FK_MapPoints_Reports_ReportId",
                table: "MapPoints",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
