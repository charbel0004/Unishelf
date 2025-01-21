using Microsoft.EntityFrameworkCore;
using Unishelf.Server.Models;

namespace Unishelf.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets for each of your models
        public DbSet<Cart> Carts { get; set; }
        public DbSet<Brands> Brands { get; set; }
        public DbSet<Categories> Categories { get; set; }
        public DbSet<Products> Products { get; set; }
        public DbSet<Images> Images { get; set; } // Images DbSet
        public DbSet<BrandImages> BrandImages { get; set; } // BrandImages DbSet

        // Configure additional behavior here if needed
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cart-Product relationship
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.Products)
                .WithMany(p => p.Cart)
                .HasForeignKey(c => c.ProductID)
                .OnDelete(DeleteBehavior.Restrict);

            // Cart-User relationship
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany(u => u.Cart)
                .HasForeignKey(c => c.UserID)
                .OnDelete(DeleteBehavior.Restrict);

            // Product-Brand relationship
            modelBuilder.Entity<Products>()
                .HasOne(p => p.Brands)
                .WithMany(b => b.Products)
                .HasForeignKey(p => p.BrandID)
                .OnDelete(DeleteBehavior.Restrict);

            // Product-Category relationship
            modelBuilder.Entity<Products>()
                .HasOne(p => p.Categories)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            // Images-Product relationship
            modelBuilder.Entity<Images>()
                .HasOne(i => i.Products)
                .WithMany(p => p.Images)
                .HasForeignKey(i => i.ProductID)
                .OnDelete(DeleteBehavior.Cascade);

            // BrandImages-Brand relationship
            modelBuilder.Entity<BrandImages>()
                .HasOne(bi => bi.Brands)
                .WithMany(b => b.BrandImages) // Assuming Brands has a collection of BrandImages
                .HasForeignKey(bi => bi.BrandID)
                .OnDelete(DeleteBehavior.Cascade); // Modify delete behavior as needed
        }
    }
}
