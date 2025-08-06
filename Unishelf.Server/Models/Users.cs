using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unishelf.Server.Models;

namespace Unishelf.Models
{
    public class User
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserID { get; set; }

        [Required]
        [MaxLength(255)]
        public string UserName { get; set; }

        [MaxLength(255)]
        public string FirstName { get; set; }

        [MaxLength(255)]
        public string LastName { get; set; }

        [Phone]
        public string PhoneNumber { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string EmailAddress { get; set; }

        [Required]
        public byte[] Password { get; set; }


        public bool IsCustomer { get; set; }
        public bool IsEmployee { get; set; }
        public bool IsManager { get; set; }
        public bool Active { get; set; }


        public DateTime? LastLogIn { get; set; }

        public ICollection<Cart> Cart {  get; set; }
        public ICollection<Order> Order {  get; set; }
    }
}
