using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Unishelf.Server.Data;
using Unishelf.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Data Protection
builder.Services.AddDataProtection(); // Add this to register IDataProtectionProvider

// Register your custom PasswordHasher as a scoped service
builder.Services.AddScoped<PasswordHasher>(); // Register _passwordHasher (or PasswordHasher if renamed)

// Register EncryptionHelper
builder.Services.AddSingleton<EncryptionHelper>();


// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes("YourSecretKeyHere")),
            ClockSkew = TimeSpan.Zero // Optional: prevent delay in token expiry
        };
    });
builder.Services.AddAuthorization();

// Add services to the container
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        policy => policy.AllowAnyOrigin() // Allows all origins
                        .AllowAnyHeader() // Allows any headers
                        .AllowAnyMethod()); // Allows any HTTP method
});

var app = builder.Build();

// Serve static files (like images, CSS, etc.)
app.UseDefaultFiles();
app.UseStaticFiles();
// Enable CORS
app.UseCors("AllowAllOrigins");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();
