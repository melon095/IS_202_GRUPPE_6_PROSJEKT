using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kartverket.Web.Migrations
{
    /// <inheritdoc />
    public partial class unique_point_order : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HindrancePoints_HindranceObjects_HindranceObjectId",
                table: "HindrancePoints");
            
            migrationBuilder.DropIndex(
                name: "IX_HindrancePoints_HindranceObjectId",
                table: "HindrancePoints");

            migrationBuilder.CreateIndex(
                name: "IX_HindrancePoints_HindranceObjectId_Order",
                table: "HindrancePoints",
                columns: new[] { "HindranceObjectId", "Order" },
                unique: true);
            
            migrationBuilder.AddForeignKey(
                name: "FK_HindrancePoints_HindranceObjects_HindranceObjectId",
                table: "HindrancePoints",
                column: "HindranceObjectId",
                principalTable: "HindranceObjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HindrancePoints_HindranceObjects_HindranceObjectId",
                table: "HindrancePoints");
            
            migrationBuilder.DropIndex(
                name: "IX_HindrancePoints_HindranceObjectId_Order",
                table: "HindrancePoints");

            migrationBuilder.CreateIndex(
                name: "IX_HindrancePoints_HindranceObjectId",
                table: "HindrancePoints",
                column: "HindranceObjectId");
            
            migrationBuilder.AddForeignKey(
                name: "FK_HindrancePoints_HindranceObjects_HindranceObjectId",
                table: "HindrancePoints",
                column: "HindranceObjectId",
                principalTable: "HindranceObjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
