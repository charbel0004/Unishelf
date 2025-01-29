using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Unishelf.Server.Models
{
    public class Products
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProductID { get; set; }

        [StringLength(255),Required]
        public string ProductName { get; set; }

        public string Description { get; set; }

        [ForeignKey("BrandID")]
        public int BrandID { get; set; }

        [ForeignKey("CategoryID")]
        public int CategoryID { get; set; }

        public int? Height { get; set; }

        public int? Width { get; set; }

        public int? Depth { get; set; }

        public int? PricePerMsq {get; set; }

        public int? Price {  get; set; }

        public int? QtyPerBox { get; set; }

        public int? SqmPerBox { get; set; }

        public int? Quantity { get; set; }

        public bool Available { get; set; }


       
        
        public Brands Brands { get; set; }
        public Categories Categories { get; set; }
        public ICollection<Cart> Cart { get; set; }
        public ICollection<Images> Images { get; set; }


    }
}
