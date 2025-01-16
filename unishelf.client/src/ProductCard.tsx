import React from 'react';
import './css/ProductCard.css';

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
}

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <div className="product-card">
            <img src={product.image} alt={product.name} />
            <div className="product-info">
                <h3>{product.name}</h3>
                <p>${product.price}</p>
                <button>Add to Cart</button>
            </div>
        </div>
    );
}

export default ProductCard;
