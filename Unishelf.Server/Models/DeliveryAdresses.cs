using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unishelf.Server.Models
{
    public class DeliveryAddresses
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DeliveryAddressID { get; set; }

        [Required]
        [MaxLength(255)]
        public string Street { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; }

        [Required]
        [MaxLength(20)]
        public string PostalCode { get; set; }

        [Required]
        [MaxLength(100)]
        public string Country { get; set; }

        [MaxLength(255)]
        public string? StateProvince { get; set; }

        [Phone]
        public string PhoneNumber { get; set; }

        // Navigation property to link to Order
        public int OrderID { get; set; }
        public Order? Order { get; set; }
    }
}