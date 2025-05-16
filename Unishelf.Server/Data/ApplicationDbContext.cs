using Microsoft.EntityFrameworkCore;
using Unishelf.Models;
using Unishelf.Server.Models;

namespace Unishelf.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets for each of your models, marked as virtual
        public virtual DbSet<User> User { get; set; }
        public virtual DbSet<Cart> Carts { get; set; }
        public virtual DbSet<Brands> Brands { get; set; }
        public virtual DbSet<Categories> Categories { get; set; }
        public virtual DbSet<Products> Products { get; set; }
        public virtual DbSet<Images> Images { get; set; }
        public virtual DbSet<BrandImages> BrandImages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cart relationships
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.Products)
                .WithMany(p => p.Cart)
                .HasForeignKey(c => c.ProductID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany(u => u.Cart)
                .HasForeignKey(c => c.UserID)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Cart properties
            modelBuilder.Entity<Cart>()
                .Property(c => c.UnitPrice)
                .HasColumnType("decimal(18,2)"); // Ensure precision for UnitPrice

            modelBuilder.Entity<Cart>()
                .Property(c => c.TotalPrice)
                .HasColumnType("decimal(18,2)"); // Ensure precision for TotalPrice

            // Add indexes for performance
            modelBuilder.Entity<Cart>()
                .HasIndex(c => c.UserID)
                .HasDatabaseName("IX_Carts_UserID");

            modelBuilder.Entity<Cart>()
                .HasIndex(c => c.ProductID)
                .HasDatabaseName("IX_Carts_ProductID");

            // Products relationships
            modelBuilder.Entity<Products>()
                .HasOne(p => p.Brands)
                .WithMany(b => b.Products)
                .HasForeignKey(p => p.BrandID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Products>()
                .HasOne(p => p.Categories)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            // Images relationships
            modelBuilder.Entity<Images>()
                .HasOne(i => i.Products)
                .WithMany(p => p.Images)
                .HasForeignKey(i => i.ProductID)
                .OnDelete(DeleteBehavior.Cascade);

            // BrandImages relationships
            modelBuilder.Entity<BrandImages>()
                .HasOne(bi => bi.Brands)
                .WithMany(b => b.BrandImages)
                .HasForeignKey(bi => bi.BrandID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Products>()
                .HasOne(p => p.Brands)
                .WithMany(b => b.Products)
                .HasForeignKey(p => p.BrandID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Products>()
                .HasOne(p => p.Categories)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Images>()
                .HasOne(i => i.Products)
                .WithMany(p => p.Images)
                .HasForeignKey(i => i.ProductID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BrandImages>()
                .HasOne(bi => bi.Brands)
                .WithMany(b => b.BrandImages)
                .HasForeignKey(bi => bi.BrandID)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}