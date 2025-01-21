using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Unishelf.Server.Models
{
    public class Brands
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BrandID { get; set; }

        [StringLength(255)]
        public string BrandName { get; set; }

        public bool BrandEnabled { get; set; }

        public ICollection<Products> Products { get; set; }
        public ICollection<BrandImages> BrandImages { get; set; }

    }
}
