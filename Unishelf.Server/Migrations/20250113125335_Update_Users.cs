using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unishelf.Server.Migrations
{
    /// <inheritdoc />
    public partial class Update_Users : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add a temporary column for the new data type
            migrationBuilder.AddColumn<byte[]>(
                name: "PasswordBinary",
                table: "Users",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: new byte[0]);

            // Step 2: Copy data from the old column to the new column with conversion
            migrationBuilder.Sql(
                "UPDATE Users SET PasswordBinary = CONVERT(varbinary(max), Password)");

            // Step 3: Drop the old column
            migrationBuilder.DropColumn(
                name: "Password",
                table: "Users");

            // Step 4: Rename the new column to the original name
            migrationBuilder.RenameColumn(
                name: "PasswordBinary",
                table: "Users",
                newName: "Password");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add the original column back
            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            // Step 2: Copy data back to the original column with conversion
            migrationBuilder.Sql(
                "UPDATE Users SET Password = CONVERT(nvarchar(max), Password)");

            // Step 3: Drop the temporary column
            migrationBuilder.DropColumn(
                name: "PasswordBinary",
                table: "Users");
        }
    }
}
