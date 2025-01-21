using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Unishelf.Server.Models
{
    public class Images
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ImageID { get; set; }

        public string Image {  get; set; }

        [ForeignKey("ProductID")]
        public int ProductID { get; set; }

        public Products Products { get; set; }
    }
}
