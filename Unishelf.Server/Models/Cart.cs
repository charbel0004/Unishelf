using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unishelf.Models;

namespace Unishelf.Server.Models
{
    public class Cart
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CartID { get; set; }

        [ForeignKey("UserID")]
        public int UserID { get; set; }

        [ForeignKey("ProductID")]
        public int ProductID { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Qty { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue, ErrorMessage = "Price cannot be negative")]
        public decimal UnitPrice { get; set; } // Price at time of adding to cart

        [DataType(DataType.DateTime)]
        public DateTime AddedDate { get; set; } // When item was added

        [DataType(DataType.DateTime)]
        public DateTime? UpdatedDate { get; set; } // When item was last updated (nullable)

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue, ErrorMessage = "Total price cannot be negative")]
        public decimal TotalPrice { get; set; } // UnitPrice * Qty, updated on Qty change

        public Products Products { get; set; }
        public User User { get; set; }
    }
}