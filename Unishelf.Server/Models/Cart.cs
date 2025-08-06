using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unishelf.Models;

namespace Unishelf.Server.Models
{
    public class Cart
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CartID { get; set; }

        [ForeignKey("User")]
        public int UserID { get; set; }

        [ForeignKey("Products")]
        public int ProductID { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Qty { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,4)")]
        public decimal TotalPrice { get; set; }


        [DataType(DataType.DateTime)]
        public DateTime AddedDate { get; set; } // When item was added

        [DataType(DataType.DateTime)]
        public DateTime? UpdatedDate { get; set; } // When item was last updated (nullable)


        public Products Products { get; set; }
        public User User { get; set; }
    }
}