using Microsoft.EntityFrameworkCore;
using Unishelf.Models;

namespace Unishelf.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Define DbSets for your models
        public DbSet<User> Users { get; set; }

        // Optional: Configure additional settings via Fluent API
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Example of Fluent API configuration (if needed):
            modelBuilder.Entity<User>()
                .Property(u => u.EmailAddress)
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.UserName)
                .HasMaxLength(255)
                .IsRequired();
        }

    }
}
