using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Unishelf.Server.Models
{
    public class BrandImages
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BrandImagesID { get; set; }

        [ForeignKey("BrandID")]
        public int BrandID { get; set; }

        public byte [] BrandImage {  get; set; }

        public Brands Brands { get; set; }
    }
}
