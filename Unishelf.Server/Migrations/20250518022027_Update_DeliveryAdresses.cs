using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unishelf.Server.Migrations
{
    /// <inheritdoc />
    public partial class Update_DeliveryAdresses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressLine2",
                table: "DeliveryAddresses");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "DeliveryAddresses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "DeliveryAddresses");

            migrationBuilder.AddColumn<string>(
                name: "AddressLine2",
                table: "DeliveryAddresses",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }
    }
}
