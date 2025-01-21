using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
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

        public int Qty { get; set; }

        
        public Products Products { get; set; }
        public User User { get; set; }
    }
}
