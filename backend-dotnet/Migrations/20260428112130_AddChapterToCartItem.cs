using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArtLab.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddChapterToCartItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChapterId",
                table: "CartItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_ChapterId",
                table: "CartItems",
                column: "ChapterId");

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_Chapters_ChapterId",
                table: "CartItems",
                column: "ChapterId",
                principalTable: "Chapters",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_Chapters_ChapterId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_ChapterId",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "ChapterId",
                table: "CartItems");
        }
    }
}
