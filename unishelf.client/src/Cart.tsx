import React, { useState } from 'react';

interface Product {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

const Cart: React.FC = () => {
    // Example cart state with products
    const [cart, setCart] = useState<Product[]>([
        { id: 1, name: 'Product 1', price: 10, quantity: 1 },
        { id: 2, name: 'Product 2', price: 20, quantity: 2 },
    ]);

    // Calculate total price
    const getTotalPrice = (): number => {
        return cart.reduce((total, product) => total + product.price * product.quantity, 0);
    };

    // Handle removing an item from the cart
    const removeItem = (id: number) => {
        setCart(cart.filter(product => product.id !== id));
    };

    // Handle quantity change
    const handleQuantityChange = (id: number, quantity: number) => {
        const updatedCart = cart.map(product =>
            product.id === id ? { ...product, quantity } : product
        );
        setCart(updatedCart);
    };

    return (
        <div className="cart">
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div>
                    <ul>
                        {cart.map(product => (
                            <li key={product.id} className="cart-item">
                                <span>{product.name}</span>
                                <span>${product.price}</span>
                                <input
                                    type="number"
                                    value={product.quantity}
                                    onChange={e => handleQuantityChange(product.id, parseInt(e.target.value))}
                                    min="1"
                                />
                                <button onClick={() => removeItem(product.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                    <div className="cart-total">
                        <strong>Total Price: ${getTotalPrice()}</strong>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
