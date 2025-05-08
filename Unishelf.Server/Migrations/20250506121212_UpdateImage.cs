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
            // Update the column to convert existing string data (possibly base64) into binary data
            migrationBuilder.Sql(
                @"UPDATE [Images]
                  SET [Image] = CAST(CAST([Image] AS XML).value('xs:base64Binary(.)', 'VARBINARY(MAX)') AS VARBINARY(MAX)) 
                  WHERE [Image] IS NOT NULL");

            // Alter the column to varbinary(max)
            migrationBuilder.AlterColumn<byte[]>(
                name: "Image",
                table: "Images",
                type: "varbinary(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert the column back to string (nvarchar(max))
            migrationBuilder.AlterColumn<string>(
                name: "Image",
                table: "Images",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)");
        }
    }
}
