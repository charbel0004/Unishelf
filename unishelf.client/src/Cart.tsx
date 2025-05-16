import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import config from './config';
import './css/Cart.css';

interface CartProduct {
    id: string; // Encrypted product ID
    name: string;
    price: number;
    quantity: number;
}

const sessionCart = {
    get: (): CartProduct[] => {
        const cart = sessionStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    },
    set: (cart: CartProduct[]) => {
        sessionStorage.setItem('cart', JSON.stringify(cart));
    },
    clear: () => {
        sessionStorage.removeItem('cart');
    },
};

const Cart: React.FC = () => {
    const { user } = useUser();
    const [cart, setCart] = useState<CartProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch cart for logged-in user or load from sessionStorage
    useEffect(() => {
        const loadCart = async () => {
            setLoading(true);
            setError(null);
            try {
                if (user.username && user.token) {
                    // Fetch cart from backend for logged-in user
                    const response = await fetch(`${config.API_URL}/api/Cart/Get-Cart-Items?userId=${user.username}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${user.token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch cart');
                    }
                    const cartData: CartProduct[] = await response.json();
                    setCart(cartData);
                } else {
                    // Load cart from sessionStorage for non-logged-in user
                    setCart(sessionCart.get());
                }
            } catch (err) {
                console.error('Error loading cart:', err);
                setError('Unable to load cart. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadCart();
    }, [user]);

    // Calculate total price
    const getTotalPrice = (): number => {
        return cart.reduce((total, product) => total + product.price * product.quantity, 0);
    };

    // Handle removing an item from the cart
    const removeItem = async (id: string) => {
        try {
            if (user.username && user.token) {
                // Remove item from backend
                const response = await fetch(`${config.API_URL}/api/Cart/Remove-Cart-Items`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: user.username, encryptedProductId: id }),
                });
                if (!response.ok) {
                    throw new Error('Failed to remove item');
                }
            }
            // Update local cart state
            const updatedCart = cart.filter((product) => product.id !== id);
            setCart(updatedCart);
            if (!user.username) {
                sessionCart.set(updatedCart);
            }
            alert('Item removed from cart.');
        } catch (err) {
            console.error('Error removing item:', err);
            alert('Error removing item from cart.');
        }
    };

    // Handle quantity change
    const handleQuantityChange = async (id: string, quantity: number) => {
        if (quantity < 1) return; // Prevent negative or zero quantities

        try {
            if (user.username && user.token) {
                // Update quantity in backend
                const response = await fetch(`${config.API_URL}/api/Cart/Update-Cart-Items`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: user.username, encryptedProductId: id, quantity }),
                });
                if (!response.ok) {
                    throw new Error('Failed to update quantity');
                }
            }
            // Update local cart state
            const updatedCart = cart.map((product) =>
                product.id === id ? { ...product, quantity } : product
            );
            setCart(updatedCart);
            if (!user.username) {
                sessionCart.set(updatedCart);
            }
        } catch (err) {
            console.error('Error updating quantity:', err);
            alert('Error updating quantity. Please try again.');
        }
    };

    // Clear entire cart
    const clearCart = async () => {
        try {
            if (user.username && user.token) {
                // Clear cart in backend
                const response = await fetch(`${config.API_URL}/api/Cart/Clear-Cart-Items`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: user.username }),
                });
                if (!response.ok) {
                    throw new Error('Failed to clear cart');
                }
            }
            // Update local cart state
            setCart([]);
            if (!user.username) {
                sessionCart.clear();
            }
            alert('Cart cleared.');
        } catch (err) {
            console.error('Error clearing cart:', err);
            alert('Error clearing cart. Please try again.');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading cart...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center py-8">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
            {cart.length === 0 ? (
                <p className="text-gray-600">Your cart is empty.</p>
            ) : (
                <div>
                    <button
                        onClick={clearCart}
                        className="bg-red-500 text-white px-4 py-2 rounded mb-4 hover:bg-red-600"
                    >
                        Clear Cart
                    </button>
                    <ul className="space-y-4">
                        {cart.map((product) => (
                            <li
                                key={product.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <span className="text-lg">{product.name}</span>
                                <div className="flex items-center space-x-4">
                                    <span className="text-lg">${product.price.toFixed(2)}</span>
                                    <input
                                        type="number"
                                        value={product.quantity}
                                        onChange={(e) =>
                                            handleQuantityChange(product.id, parseInt(e.target.value))
                                        }
                                        min="1"
                                        className="w-16 p-1 border rounded"
                                    />
                                    <button
                                        onClick={() => removeItem(product.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 text-right">
                        <strong className="text-xl">
                            Total Price: ${getTotalPrice().toFixed(2)}
                        </strong>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;