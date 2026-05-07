using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArtLab.Backend.Migrations
{
    /// <inheritdoc />
    public partial class RenameDurationToSeconds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DurationMinutes",
                table: "Lessons",
                newName: "DurationSeconds");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DurationSeconds",
                table: "Lessons",
                newName: "DurationMinutes");
        }
    }
}
