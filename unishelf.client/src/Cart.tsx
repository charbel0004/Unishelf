import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Cart.css';
import config from './config';

// Interface matching Unishelf.Server.Models.Cart
interface CartItem {
    cartID: string;
    userID: string;
    productID: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    addedDate: string;
    updatedDate: string;
    products: Product;
    user: any;
}

// Interface matching Unishelf.Server.Models.Product
interface Product {
    productID: string;
    productName: string;
    description: string;
    brandID: number;
    categoryID: number;
    height: number;
    width: number;
    depth: number;
    pricePerMsq: number;
    price: number;
    currency: string;
    qtyPerBox: number;
    sqmPerBox: number;
    quantity: number;
    available: boolean;
    brands: any;
    categories: any;
    images: any;
}

interface CartProduct {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
    currency: string;
}

// Order and related interfaces
interface Order {
    orderID?: number;
    userID?: string | null;
    orderDate: string;
    subtotal: number;
    deliveryCharge: number;
    grandTotal: number;
    status: string;
    createdDate?: string;
    updatedDate?: string | null;
    orderItems: OrderItem[];
    DeliveryAddresses: DeliveryAddresses;
}

interface OrderItem {
    orderItemID?: number;
    orderID?: number;
    productID: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface DeliveryAddresses {
    deliveryAddressID?: number;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    stateProvince: string;
    phoneNumber: string;
}

const sessionCart = {
    get: (): CartProduct[] => {
        const cart = sessionStorage.getItem('cart');
        const items = cart ? JSON.parse(cart) : [];
        const mergedItems = items.reduce((acc: CartProduct[], item: CartProduct) => {
            const existingItem = acc.find((i) => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                return acc;
            }
            return [...acc, item];
        }, []);
        const normalizedItems = mergedItems.map((item: CartProduct) => ({
            ...item,
            image: item.image && !item.image.startsWith('data:image/jpeg;base64,')
                ? `data:image/jpeg;base64,${item.image}`
                : item.image,
            currency: item.currency || 'USD',
        }));
        console.log('Retrieved and merged sessionCart:', normalizedItems);
        return normalizedItems;
    },
    set: (cart: CartProduct[]) => {
        const mergedCart = cart.reduce((acc: CartProduct[], item: CartProduct) => {
            const existingItem = acc.find((i) => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                return acc;
            }
            return [...acc, item];
        }, []);
        const normalizedCart = mergedCart.map((item: CartProduct) => ({
            ...item,
            image: item.image && !item.image.startsWith('data:image/jpeg;base64,')
                ? `data:image/jpeg;base64,${item.image}`
                : item.image,
            currency: item.currency || 'USD',
        }));
        console.log('Saving to sessionCart:', normalizedCart);
        sessionStorage.setItem('cart', JSON.stringify(normalizedCart));
    },
    add: (item: CartProduct) => {
        const currentCart = sessionCart.get();
        const newItem = {
            ...item,
            image: item.image && !item.image.startsWith('data:image/jpeg;base64,')
                ? `data:image/jpeg;base64,${item.image}`
                : item.image,
            currency: item.currency || 'USD',
        };
        const updatedCart = [...currentCart, newItem];
        sessionCart.set(updatedCart);
    },
    clear: () => {
        sessionStorage.removeItem('cart');
    },
};

// Utility function to validate token
const validateToken = (token: string | null): { isValid: boolean; userId: string | null } => {
    if (!token) {
        return { isValid: false, userId: null };
    }
    try {
        const decodedToken = config.getDecodedToken();
        const exp = decodedToken.exp as number | undefined;
        const currentTime = Math.floor(Date.now() / 1000);
        if (exp && exp < currentTime) {
            console.warn('Token is expired');
            localStorage.removeItem('token');
            return { isValid: false, userId: null };
        }
        const uid = decodedToken['UserID'] as string | undefined;
        if (!uid) {
            console.warn('UserID claim not found in token:', decodedToken);
            localStorage.removeItem('token');
            return { isValid: false, userId: null };
        }
        return { isValid: true, userId: uid };
    } catch (err) {
        console.error('Error decoding token:', err);
        localStorage.removeItem('token');
        return { isValid: false, userId: null };
    }
};

const Cart: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddresses>({
        street: '',
        city: '',
        postalCode: '',
        country: '',
        stateProvince: '',
        phoneNumber: '',
    });
    const navigate = useNavigate();
    const currency = 'USD';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const { userId } = validateToken(token);
        setUserId(userId);
        if (!userId) {
            console.warn('No valid user session found');
        }
    }, []);

    const fetchCartItems = async () => {
        setLoading(true);
        setError(null);
        try {
            if (userId) {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Authentication token is missing.');
                }
                const response = await fetch(
                    `${config.API_URL}/api/Cart/user/${encodeURIComponent(userId)}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch cart items.');
                }
                const items = await response.json();
                const cartItemsArray = Array.isArray(items) ? items : items.$values || [];
                if (!Array.isArray(cartItemsArray)) {
                    console.error('Unexpected response from server. Expected an array, got:', items);
                    setError('Failed to retrieve cart items: Invalid data format from server.');
                    setCartItems([]);
                    return;
                }
                const mappedItems: CartProduct[] = cartItemsArray.map((item: any) => ({
                    id: item.id || '',
                    name: item.name || 'Unknown Product',
                    price: item.price || 0,
                    quantity: item.quantity || 0,
                    image: item.image ? `data:image/jpeg;base64,${item.image}` : null,
                    currency: item.currency || 'USD',
                }));
                setCartItems(mappedItems);
            } else {
                const items = sessionCart.get();
                setCartItems(items);
            }
        } catch (err: any) {
            console.error('Error fetching cart items:', err);
            setError(`Unable to load cart: ${err.message}`);
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartItems();
    }, [userId]);

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        if (userId) {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token is missing.');
                const response = await fetch(`${config.API_URL}/api/Cart/Update`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        encryptedUserId: userId,
                        encryptedProductId: itemId,
                        quantity: newQuantity,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update cart item.');
                }
                setCartItems((prev) =>
                    prev.map((item) =>
                        item.id === itemId ? { ...item, quantity: newQuantity } : item
                    )
                );
                window.dispatchEvent(new Event('cartUpdated'));
            } catch (err: any) {
                console.error('Error updating cart item:', err);
                setError(`Error updating cart item: ${err.message}`);
                setTimeout(() => setError(null), 5000);
            }
        } else {
            const updatedCart = cartItems.map((item) =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
            sessionCart.set(updatedCart);
            setCartItems(updatedCart);
            window.dispatchEvent(new Event('cartUpdated'));
        }
    };

    const removeItem = async (itemId: string) => {
        if (userId) {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token is missing.');
                const response = await fetch(`${config.API_URL}/api/Cart/Remove`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        encryptedUserId: userId,
                        encryptedProductId: itemId,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to remove cart item.');
                }
                setCartItems((prev) => prev.filter((item) => item.id !== itemId));
                window.dispatchEvent(new Event('cartUpdated'));
            } catch (err: any) {
                console.error('Error removing cart item:', err);
                setError(`Error removing cart item: ${err.message}`);
                setTimeout(() => setError(null), 5000);
            }
        } else {
            const updatedCart = cartItems.filter((item) => item.id !== itemId);
            sessionCart.set(updatedCart);
            setCartItems(updatedCart);
            window.dispatchEvent(new Event('cartUpdated'));
        }
    };

    const clearCart = async () => {
        if (userId) {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token is missing.');
                const response = await fetch(`${config.API_URL}/api/Cart/Clear`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ encryptedUserId: userId }),
                });

                if (!response.ok) {
                    let errorMessage = 'Failed to clear cart.';
                    try {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorData.message || errorMessage;
                        } else {
                            const errorText = await response.text();
                            errorMessage = errorText || `Server error (${response.status})`;
                        }
                    } catch (parseError) {
                        console.error('Error parsing error response:', parseError);
                        errorMessage = `Server error (${response.status}): Unable to parse response`;
                    }
                    throw new Error(errorMessage);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const result = await response.json();
                    console.log('Clear cart response:', result);
                } else {
                    console.warn('Non-JSON response received:', await response.text());
                }

                await fetchCartItems();
                window.dispatchEvent(new Event('cartUpdated'));
            } catch (err: any) {
                console.error('Error clearing cart:', err);
                setError(`Error clearing cart: ${err.message}`);
                setTimeout(() => setError(null), 5000);
            }
        } else {
            sessionCart.clear();
            setCartItems([]);
            window.dispatchEvent(new Event('cartUpdated'));
        }
    };

    const calculateTotal = (item: CartProduct) => {
        return Number((item.price * item.quantity).toFixed(2));
    };

    const calculateSubtotal = () => {
        return Number(
            cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
        );
    };

    const calculateDeliveryCharge = () => {
        const subtotal = calculateSubtotal();
        return subtotal > 200 ? 0 : 3;
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const deliveryCharge = calculateDeliveryCharge();
        return Number((subtotal + deliveryCharge).toFixed(2));
    };

    const isFreeShippingEligible = () => {
        const subtotal = calculateSubtotal();
        return subtotal > 200;
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            setError('Your cart is empty.');
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (
            !deliveryAddress.street ||
            !deliveryAddress.city ||
            !deliveryAddress.postalCode ||
            !deliveryAddress.country ||
            !deliveryAddress.stateProvince ||
            !deliveryAddress.phoneNumber
        ) {
            setError('Please fill in all required delivery address fields.');
            setTimeout(() => setError(null), 5000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const { isValid, userId: validatedUserId } = validateToken(token);
            setUserId(validatedUserId);

            const order: Order = {
                userID: validatedUserId,
                orderDate: new Date().toISOString(),
                subtotal: calculateSubtotal(),
                deliveryCharge: calculateDeliveryCharge(),
                grandTotal: calculateGrandTotal(),
                status: 'Pending',
                orderItems: cartItems.map((item) => ({
                    productID: item.id,
                    quantity: item.quantity,
                    unitPrice: Number(item.price.toFixed(2)),
                    totalPrice: Number((item.price * item.quantity).toFixed(2)),
                })),
                DeliveryAddresses: { ...deliveryAddress },
            };

            let response;
            if (isValid && token) {
                console.log('Attempting authenticated checkout with token:', token);
                response = await fetch(`${config.API_URL}/api/Orders/Create`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(order),
                });
            } else {
                console.log('Falling back to guest checkout');
                response = await fetch(`${config.API_URL}/api/Orders/CreateGuest`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(order),
                });
            }

            if (!response.ok) {
                let errorMessage = 'Failed to place order.';
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = JSON.stringify(errorData) || `Server error (${response.status})`;
                    } else {
                        const errorText = await response.text();
                        errorMessage = errorText || `Server error (${response.status}): No details provided`;
                    }
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                    errorMessage = `Server error (${response.status}): Unable to parse response`;
                }
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    setUserId(null);
                    errorMessage += ' - Your session has expired. Redirecting to login...';
                    setError(errorMessage);
                    setTimeout(() => navigate('/login'), 2000);
                }
                throw new Error(errorMessage);
            }

            let result;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    result = await response.json();
                } else {
                    const text = await response.text();
                    throw new Error(`Expected JSON response, but got: ${text}`);
                }
            } catch (jsonError) {
                console.error('Error parsing success response:', jsonError);
                throw new Error('Failed to parse server response as JSON');
            }

            if (!result.orderID) {
                throw new Error('Server response missing orderID');
            }

            const orderId = result.orderID;

            await clearCart();
            setSuccessMessage(`Order #${orderId} placed successfully!`);
            setTimeout(() => {
                setSuccessMessage(null);
                navigate('/cart');
            }, 5000);
        } catch (err: any) {
            console.error('Error during checkout:', err);
            setError(`Error placing order: ${err.message}`);
            setTimeout(() => setError(null), 5000);
        }
    };

    if (loading) return <div className="cart-loading">Loading cart...</div>;
    if (error) return <div className="cart-error">{error}</div>;

    return (
        <div className="cart-container">
            {successMessage && (
                <div className="cart-success-message">
                    {successMessage}
                </div>
            )}
            <div className="cart-header">
                <h2 className="cart-title">Your Cart ({cartItems.length} items)</h2>
                {cartItems.length > 0 && (
                    <button
                        className="cart-clear-button"
                        onClick={clearCart}
                        aria-label="Clear cart"
                    >
                        Clear Cart
                    </button>
                )}
            </div>
            {cartItems.length === 0 ? (
                <p className="cart-empty">Your cart is empty.</p>
            ) : (
                <div className="cart-content">
                    <div className="cart-items-wrapper">
                        <div className="cart-items">
                            <div className="cart-item-header">
                                <span>Item</span>
                                <span>Price</span>
                                <span>Quantity</span>
                                <span>Total</span>
                                <span>Action</span>
                            </div>
                            {cartItems.map((item) => {
                                console.log('Image data for item:', item.name, item.image);
                                return (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-details">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="cart-item-image"
                                                    onError={(e) => console.error('Image failed to load:', e)}
                                                />
                                            ) : (
                                                <div className="cart-item-no-image">No image available</div>
                                            )}
                                            <div className="cart-item-info">
                                                <h3 className="cart-item-name">{item.name}</h3>
                                            </div>
                                        </div>
                                        <span className="cart-item-price">${item.price.toFixed(2)} {item.currency}</span>
                                        <div className="cart-quantity">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                aria-label={`Decrease quantity of ${item.name}`}
                                                className="cart-buttons"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateQuantity(item.id, parseInt(e.target.value) || 1)
                                                }
                                                min="1"
                                                aria-label={`Quantity of ${item.name}`}
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                aria-label={`Increase quantity of ${item.name}`}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="cart-item-total">${calculateTotal(item)} {item.currency}</span>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="cart-remove-button"
                                            aria-label={`Remove ${item.name} from cart`}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="cart-summary">
                        <div className="cart-summary-row">
                            <span>Subtotal:</span>
                            <span>${calculateSubtotal()} {currency}</span>
                        </div>
                        <div className="cart-summary-row">
                            <span>Delivery Charge:</span>
                            <span>${calculateDeliveryCharge().toFixed(2)} {currency}</span>
                        </div>
                        <div className="cart-summary-row">
                            <span>Grand Total:</span>
                            <span>${calculateGrandTotal()} {currency}</span>
                        </div>
                        {isFreeShippingEligible() && (
                            <div className="cart-shipping-notice">
                                Congrats, you're eligible for Free Shipping
                                <span className="cart-shipping-icon">🚚</span>
                            </div>
                        )}
                        <div className="cart-delivery-address">
                            <h3>Delivery Address</h3>
                            <div className="delivery-address-field">
                                <label htmlFor="street">
                                    Street<span className="required-star">*</span>
                                </label>
                                <input
                                    id="street"
                                    type="text"
                                    placeholder="Enter your street"
                                    value={deliveryAddress.street}
                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                                    className={deliveryAddress.street ? '' : 'invalid'}
                                    aria-required="true"
                                    required
                                />
                            </div>
                            <div className="delivery-address-field">
                                <label htmlFor="city">
                                    City<span className="required-star">*</span>
                                </label>
                                <input
                                    id="city"
                                    type="text"
                                    placeholder="Enter your city"
                                    value={deliveryAddress.city}
                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                                    className={deliveryAddress.city ? '' : 'invalid'}
                                    aria-required="true"
                                    required
                                />
                            </div>
                            <div className="delivery-address-field">
                                <label htmlFor="postalCode">
                                    Postal Code<span className="required-star">*</span>
                                </label>
                                <input
                                    id="postalCode"
                                    type="text"
                                    placeholder="Enter your postal code"
                                    value={deliveryAddress.postalCode}
                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })}
                                    className={deliveryAddress.postalCode ? '' : 'invalid'}
                                    aria-required="true"
                                    required
                                />
                            </div>
                            <div className="delivery-address-field">
                                <label htmlFor="country">
                                    Country<span className="required-star">*</span>
                                </label>
                                <input
                                    id="country"
                                    type="text"
                                    placeholder="Enter your country"
                                    value={deliveryAddress.country}
                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, country: e.target.value })}
                                    className={deliveryAddress.country ? '' : 'invalid'}
                                    aria-required="true"
                                    required
                                />
                            </div>
                            <div className="delivery-address-field">
                                <label htmlFor="stateProvince">
                                    State/Province<span className="required-star">*</span>
                                </label>
                                <input
                                    id="stateProvince"
                                    type="text"
                                    placeholder="Enter your state/province"
                                    value={deliveryAddress.stateProvince}
                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, stateProvince: e.target.value })}
                                    className={deliveryAddress.stateProvince ? '' : 'invalid'}
                                    aria-required="true"
                                    required
                                />
                            </div>
                            <div className="delivery-address-field">
                                <label htmlFor="phoneNumber">
                                    Phone Number<span className="required-star">*</span>
                                </label>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    value={deliveryAddress.phoneNumber}
                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phoneNumber: e.target.value })}
                                    className={deliveryAddress.phoneNumber ? '' : 'invalid'}
                                    aria-required="true"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            className="cart-checkout-button"
                            onClick={handleCheckout}
                            aria-label="Proceed to checkout"
                        >
                            Check out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;