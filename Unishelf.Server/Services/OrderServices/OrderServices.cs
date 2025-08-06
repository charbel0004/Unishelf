using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Unishelf.Server.Data;
using Unishelf.Server.Models;

namespace Unishelf.Server.Services
{
    public class OrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly EncryptionHelper _encryptionHelper;

        public OrderService(ApplicationDbContext context, EncryptionHelper encryptionHelper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _encryptionHelper = encryptionHelper ?? throw new ArgumentNullException(nameof(encryptionHelper));
        }

        // Nested DTO classes
        public class OrderRequestDto
        {
            public string? userID { get; set; }
            public string orderDate { get; set; }
            public double subtotal { get; set; }
            public double deliveryCharge { get; set; }
            public double grandTotal { get; set; }
            public string status { get; set; }
            public List<OrderItemRequestDto> orderItems { get; set; }
            public DeliveryAddresses DeliveryAddresses { get; set; }
        }

        public class OrderItemRequestDto
        {
            public string productID { get; set; }
            public int quantity { get; set; }
            public double unitPrice { get; set; }
            public double totalPrice { get; set; }
        }

        private int? DecryptId(string encryptedId)
        {
            if (string.IsNullOrEmpty(encryptedId))
            {
                return null;
            }
            try
            {
                var decryptedId = _encryptionHelper.Decrypt(encryptedId);
                if (int.TryParse(decryptedId, out int id))
                {
                    return id;
                }
                return null;
            }
            catch (Exception ex)
            {
                // Log the specific error for debugging
                Console.WriteLine($"Decryption failed for ID '{encryptedId}': {ex.Message}");
                return null;
            }
        }

        public async Task<int> CreateOrderAsync(OrderRequestDto orderDto)
        {
            if (orderDto == null)
                throw new ArgumentNullException(nameof(orderDto));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                int? decryptedUserId = DecryptId(orderDto.userID);
                if (orderDto.userID != null && !decryptedUserId.HasValue)
                    throw new ArgumentException($"Failed to decrypt userID: {orderDto.userID}", nameof(orderDto.userID));

                var orderEntity = new Order
                {
                    UserID = decryptedUserId,
                    OrderDate = DateTime.TryParse(orderDto.orderDate, out var parsedDate) ? parsedDate : DateTime.UtcNow,
                    Subtotal = orderDto.subtotal > 0 ? (decimal)orderDto.subtotal : 0m,
                    DeliveryCharge = orderDto.deliveryCharge > 0 ? (decimal)orderDto.deliveryCharge : 0m,
                    GrandTotal = orderDto.grandTotal > 0 ? (decimal)orderDto.grandTotal : 0m,
                    Status = string.IsNullOrEmpty(orderDto.status) ? "Pending" : orderDto.status,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = null
                };

                if (orderDto.DeliveryAddresses == null)
                    throw new ArgumentException("DeliveryAddresses is required", nameof(orderDto));

                _context.Orders.Add(orderEntity);
                await _context.SaveChangesAsync();

                var deliveryAddresses = new DeliveryAddresses
                {
                    Street = orderDto.DeliveryAddresses.Street ?? throw new ArgumentException("Street is required", nameof(orderDto)),
                    City = orderDto.DeliveryAddresses.City ?? throw new ArgumentException("City is required", nameof(orderDto)),
                    PostalCode = orderDto.DeliveryAddresses.PostalCode ?? throw new ArgumentException("PostalCode is required", nameof(orderDto)),
                    Country = orderDto.DeliveryAddresses.Country ?? throw new ArgumentException("Country is required", nameof(orderDto)),
                    StateProvince = orderDto.DeliveryAddresses.StateProvince,
                    PhoneNumber = orderDto.DeliveryAddresses.PhoneNumber,
                    OrderID = orderEntity.OrderID,
                    Order = orderEntity
                };
                orderEntity.DeliveryAddresses = deliveryAddresses;

                _context.DeliveryAddresses.Add(deliveryAddresses);
                await _context.SaveChangesAsync();

                if (orderDto.orderItems != null && orderDto.orderItems.Any())
                {
                    foreach (var item in orderDto.orderItems)
                    {
                        if (string.IsNullOrEmpty(item.productID))
                            throw new ArgumentException("productID is required", nameof(item.productID));

                        int? decryptedProductId = DecryptId(item.productID);
                        if (!decryptedProductId.HasValue)
                            throw new ArgumentException($"Failed to decrypt productID: {item.productID}", nameof(item.productID));

                        // Fetch product to check stock and availability
                        var product = await _context.Products.FindAsync(decryptedProductId.Value);
                        if (product == null)
                            throw new ArgumentException($"Product not found for productID: {item.productID}", nameof(item.productID));
                        if (!product.Available)
                            throw new ArgumentException($"Product is not available: {item.productID}", nameof(item.productID));
                        if (product.Quantity == null || product.Quantity < item.quantity)
                            throw new ArgumentException($"Insufficient stock for productID: {item.productID}. Available: {product.Quantity ?? 0}, Requested: {item.quantity}", nameof(item.productID));

                        // Deduct quantity from stock
                        product.Quantity -= item.quantity;
                        if (product.Quantity == 0)
                            product.Available = false; // Optional: Mark as unavailable if stock is depleted

                        _context.Products.Update(product);

                        var orderItem = new OrderItem
                        {
                            OrderID = orderEntity.OrderID,
                            ProductID = decryptedProductId.Value,
                            Quantity = item.quantity > 0 ? item.quantity : 1,
                            UnitPrice = item.unitPrice > 0 ? (decimal)item.unitPrice : 0m,
                            TotalPrice = item.totalPrice > 0 ? (decimal)item.totalPrice : (decimal)item.unitPrice * item.quantity
                        };
                        _context.OrderItems.Add(orderItem);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return orderEntity.OrderID;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Failed to create order: {ex.Message}", ex);
            }
        }

        public async Task<int> CreateGuestOrderAsync(OrderRequestDto orderDto)
        {
            if (orderDto == null)
                throw new ArgumentNullException(nameof(orderDto));

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var orderEntity = new Order
                {
                    UserID = null,
                    OrderDate = DateTime.TryParse(orderDto.orderDate, out var parsedDate) ? parsedDate : DateTime.UtcNow,
                    Subtotal = orderDto.subtotal > 0 ? (decimal)orderDto.subtotal : 0m,
                    DeliveryCharge = orderDto.deliveryCharge > 0 ? (decimal)orderDto.deliveryCharge : 0m,
                    GrandTotal = orderDto.grandTotal > 0 ? (decimal)orderDto.grandTotal : 0m,
                    Status = string.IsNullOrEmpty(orderDto.status) ? "Pending" : orderDto.status,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = null
                };

                _context.Orders.Add(orderEntity);
                await _context.SaveChangesAsync();

                if (orderDto.DeliveryAddresses == null)
                    throw new ArgumentException("DeliveryAddresses is required", nameof(orderDto));

                var deliveryAddresses = new DeliveryAddresses
                {
                    Street = orderDto.DeliveryAddresses.Street ?? throw new ArgumentException("Street is required", nameof(orderDto)),
                    City = orderDto.DeliveryAddresses.City ?? throw new ArgumentException("City is required", nameof(orderDto)),
                    PostalCode = orderDto.DeliveryAddresses.PostalCode ?? throw new ArgumentException("PostalCode is required", nameof(orderDto)),
                    Country = orderDto.DeliveryAddresses.Country ?? throw new ArgumentException("Country is required", nameof(orderDto)),
                    StateProvince = orderDto.DeliveryAddresses.StateProvince,
                    PhoneNumber = orderDto.DeliveryAddresses.PhoneNumber,
                    OrderID = orderEntity.OrderID,
                    Order = orderEntity
                };
                orderEntity.DeliveryAddresses = deliveryAddresses;

                _context.DeliveryAddresses.Add(deliveryAddresses);
                await _context.SaveChangesAsync();

                if (orderDto.orderItems != null)
                {
                    foreach (var item in orderDto.orderItems)
                    {
                        if (string.IsNullOrEmpty(item.productID))
                            throw new ArgumentException("productID is required", nameof(item.productID));

                        int? decryptedProductId = DecryptId(item.productID);
                        if (!decryptedProductId.HasValue)
                            throw new ArgumentException($"Failed to decrypt productID: {item.productID}", nameof(item.productID));

                        var orderItem = new OrderItem
                        {
                            OrderID = orderEntity.OrderID,
                            ProductID = decryptedProductId.Value,
                            Quantity = item.quantity > 0 ? item.quantity : 1,
                            UnitPrice = item.unitPrice > 0 ? (decimal)item.unitPrice : 0m,
                            TotalPrice = item.totalPrice > 0 ? (decimal)item.totalPrice : (decimal)item.unitPrice * item.quantity
                        };
                        _context.OrderItems.Add(orderItem);

                        // Fetch the product and update stock
                        var product = await _context.Products
                            .FirstOrDefaultAsync(p => p.ProductID == decryptedProductId.Value);
                        if (product == null)
                            throw new ArgumentException($"Product with ID {decryptedProductId.Value} not found.", nameof(item.productID));

                        if (product.Quantity.HasValue && product.Quantity >= item.quantity)
                        {
                            product.Quantity -= item.quantity;
                        }
                        else
                        {
                            throw new InvalidOperationException($"Insufficient stock for product ID {decryptedProductId.Value}. Available: {product.Quantity}, Requested: {item.quantity}");
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return orderEntity.OrderID;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Failed to create guest order: {ex.Message}", ex);
            }
        }

       
    }
}