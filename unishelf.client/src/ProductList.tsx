import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './css/ProductList.css';

interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
}

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        // Simulate fetching data from an API
        const fetchedProducts: Product[] = [
            { id: 1, name: 'Product 1', price: 29.99, image: 'https://via.placeholder.com/150' },
            { id: 2, name: 'Product 2', price: 49.99, image: 'https://via.placeholder.com/150' },
            { id: 3, name: 'Product 3', price: 19.99, image: 'https://via.placeholder.com/150' },
        ];

        setProducts(fetchedProducts);
    }, []);

    return (
        <div className="product-list">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

export default ProductList;
