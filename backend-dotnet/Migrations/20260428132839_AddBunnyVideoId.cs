using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArtLab.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddBunnyVideoId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BunnyVideoId",
                table: "Lessons",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BunnyVideoId",
                table: "Lessons");
        }
    }
}
