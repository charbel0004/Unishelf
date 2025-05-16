using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unishelf.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Skip Images update since column is already VARBINARY(MAX)
            // Original SQL removed to avoid XML parsing error
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No changes needed for rollback
        }
    }
}