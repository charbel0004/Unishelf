using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Unishelf.Server.Models
{
    public class Categories
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CategoryID { get; set; }

        [StringLength(255),Required]
        public string CategoryName { get; set; }

        public bool CategoryEnabled { get; set; }

        public ICollection<Products> Products { get; set; }
    }
}
