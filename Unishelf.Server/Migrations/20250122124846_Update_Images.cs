using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unishelf.Server.Migrations
{
    /// <inheritdoc />
    public partial class Update_Images : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // If necessary, add a step to convert the data from base64 string to binary.
            migrationBuilder.Sql(
                @"UPDATE [Images]
                  SET [Image] = CAST(CAST([Image] AS XML).value('xs:base64Binary(.)', 'VARBINARY(MAX)') AS VARBINARY(MAX)) 
                  WHERE [Image] IS NOT NULL");

            // Alter the column to varbinary
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
            // Revert the column to string, handling any potential data loss or changes.
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
