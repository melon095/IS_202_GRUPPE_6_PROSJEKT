using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kartverket.Web.Migrations
{
    /// <inheritdoc />
    public partial class bedre_struktur : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_AspNetUsers_UserId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_ReportFeedbacks_FeedbackId",
                table: "Reports");

            migrationBuilder.DropTable(
                name: "MapPoints");

            migrationBuilder.DropTable(
                name: "ReportFeedbackAssignments");

            migrationBuilder.DropTable(
                name: "MapObjects");

            migrationBuilder.DropTable(
                name: "MapObjectTypes");

            migrationBuilder.DropIndex(
                name: "IX_Reports_FeedbackId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "FeedbackId",
                table: "Reports");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Reports",
                newName: "ReportedById");

            migrationBuilder.RenameIndex(
                name: "IX_Reports_UserId",
                table: "Reports",
                newName: "IX_Reports_ReportedById");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "ReportFeedbacks",
                newName: "FeedbackType");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Reports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "FeedbackById",
                table: "ReportFeedbacks",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.CreateTable(
                name: "HindranceTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PrimaryImageUrl = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MarkerImageUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GeometryType = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HindranceTypes", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "HindranceObjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Latitude = table.Column<double>(type: "double", nullable: false),
                    Longitude = table.Column<double>(type: "double", nullable: false),
                    MinLatitude = table.Column<double>(type: "double", nullable: true),
                    MinLongitude = table.Column<double>(type: "double", nullable: true),
                    MaxLatitude = table.Column<double>(type: "double", nullable: true),
                    MaxLongitude = table.Column<double>(type: "double", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    HindranceTypeId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ReportId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HindranceObjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HindranceObjects_HindranceTypes_HindranceTypeId",
                        column: x => x.HindranceTypeId,
                        principalTable: "HindranceTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HindranceObjects_Reports_ReportId",
                        column: x => x.ReportId,
                        principalTable: "Reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "HindrancePoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Latitude = table.Column<double>(type: "double", nullable: false),
                    Longitude = table.Column<double>(type: "double", nullable: false),
                    Elevation = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HindranceObjectId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HindrancePoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HindrancePoints_HindranceObjects_HindranceObjectId",
                        column: x => x.HindranceObjectId,
                        principalTable: "HindranceObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ReportFeedbacks_FeedbackById",
                table: "ReportFeedbacks",
                column: "FeedbackById");

            migrationBuilder.CreateIndex(
                name: "IX_ReportFeedbacks_ReportId",
                table: "ReportFeedbacks",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_HindranceObjects_HindranceTypeId",
                table: "HindranceObjects",
                column: "HindranceTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_HindranceObjects_ReportId",
                table: "HindranceObjects",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_HindrancePoints_HindranceObjectId",
                table: "HindrancePoints",
                column: "HindranceObjectId");

            migrationBuilder.CreateIndex(
                name: "IX_HindranceTypes_Name",
                table: "HindranceTypes",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ReportFeedbacks_AspNetUsers_FeedbackById",
                table: "ReportFeedbacks",
                column: "FeedbackById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ReportFeedbacks_Reports_ReportId",
                table: "ReportFeedbacks",
                column: "ReportId",
                principalTable: "Reports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_AspNetUsers_ReportedById",
                table: "Reports",
                column: "ReportedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReportFeedbacks_AspNetUsers_FeedbackById",
                table: "ReportFeedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_ReportFeedbacks_Reports_ReportId",
                table: "ReportFeedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_AspNetUsers_ReportedById",
                table: "Reports");

            migrationBuilder.DropTable(
                name: "HindrancePoints");

            migrationBuilder.DropTable(
                name: "HindranceObjects");

            migrationBuilder.DropTable(
                name: "HindranceTypes");

            migrationBuilder.DropIndex(
                name: "IX_ReportFeedbacks_FeedbackById",
                table: "ReportFeedbacks");

            migrationBuilder.DropIndex(
                name: "IX_ReportFeedbacks_ReportId",
                table: "ReportFeedbacks");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "FeedbackById",
                table: "ReportFeedbacks");

            migrationBuilder.RenameColumn(
                name: "ReportedById",
                table: "Reports",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Reports_ReportedById",
                table: "Reports",
                newName: "IX_Reports_UserId");

            migrationBuilder.RenameColumn(
                name: "FeedbackType",
                table: "ReportFeedbacks",
                newName: "Status");

            migrationBuilder.AddColumn<Guid>(
                name: "FeedbackId",
                table: "Reports",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateTable(
                name: "MapObjectTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    MarkerImageUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PrimaryImageUrl = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapObjectTypes", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ReportFeedbackAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ReportFeedbackId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportFeedbackAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportFeedbackAssignments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReportFeedbackAssignments_ReportFeedbacks_ReportFeedbackId",
                        column: x => x.ReportFeedbackId,
                        principalTable: "ReportFeedbacks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MapObjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    MapObjectTypeId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ReportId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapObjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapObjects_MapObjectTypes_MapObjectTypeId",
                        column: x => x.MapObjectTypeId,
                        principalTable: "MapObjectTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MapObjects_Reports_ReportId",
                        column: x => x.ReportId,
                        principalTable: "Reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MapPoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    MapObjectId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    AMSL = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Latitude = table.Column<double>(type: "double", nullable: false),
                    Longitude = table.Column<double>(type: "double", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapPoints_MapObjects_MapObjectId",
                        column: x => x.MapObjectId,
                        principalTable: "MapObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_FeedbackId",
                table: "Reports",
                column: "FeedbackId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MapObjects_MapObjectTypeId",
                table: "MapObjects",
                column: "MapObjectTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_MapObjects_ReportId",
                table: "MapObjects",
                column: "ReportId");

            migrationBuilder.CreateIndex(
                name: "IX_MapObjectTypes_Name",
                table: "MapObjectTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MapPoints_MapObjectId",
                table: "MapPoints",
                column: "MapObjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportFeedbackAssignments_ReportFeedbackId",
                table: "ReportFeedbackAssignments",
                column: "ReportFeedbackId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportFeedbackAssignments_UserId",
                table: "ReportFeedbackAssignments",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_AspNetUsers_UserId",
                table: "Reports",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_ReportFeedbacks_FeedbackId",
                table: "Reports",
                column: "FeedbackId",
                principalTable: "ReportFeedbacks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
