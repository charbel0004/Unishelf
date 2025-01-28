import React, { useEffect, useState } from "react";
import "./css/Products.css";
import config from "./config";

const Categories: React.FC<{
    categories: Category[];
    selectedBrand: { brandID: string; categoryID: string } | null;
    onBrandClick: (brandID: string, categoryID: string) => void;
}> = ({ categories, selectedBrand, onBrandClick }) => {
    return (
        <nav className="categories-navbar">
            <ul>
                {categories.map((category) => (
                    <li key={category.categoryID} className="category-item">
                        <h3>{category.categoryName}</h3>
                        <ul className="brands-list">
                            {category.brands.map((brand) => (
                                <li
                                    key={`${category.categoryID}-${brand.brandID}`}
                                    className={`brand-item ${selectedBrand?.brandID === brand.brandID ? "active" : ""
                                        }`}
                                    onClick={() => onBrandClick(brand.brandID, category.categoryID)}
                                >
                                    <img
                                        src={brand.brandImageBase64 ? `data:image/png;base64,${brand.brandImageBase64}` : "/default-brand-image.png"}
                                        alt={brand.brandName}
                                        className="brand-image"
                                    />
                                    {brand.brandName}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

const ProductGrid: React.FC<{
    products: Product[] | null;
    loading: boolean;
    error: string | null;
    selectedBrand: { brandID: string; categoryID: string } | null;
}> = ({ products, loading, error, selectedBrand }) => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!selectedBrand) return <p>Select a brand to view products.</p>;
    if (products && products.length === 0) return <p>No products available for this brand and category.</p>;

    return (
        <div className="products-grid">
            {products?.map((product) => (
                <div key={product.productID} className="product-card">
                    <img
                        src={product.images.length > 0 ? `data:image/png;base64,${product.images[0]}` : "/placeholder.png"}
                        alt={product.productName}
                        className="product-image"
                    />
                    <h4 className="product-name">{product.productName}</h4>
                    <p className="product-quantity">Quantity: {product.quantity}</p>
                </div>
            ))}
        </div>
    );
};

const Products: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedBrand, setSelectedBrand] = useState<{ brandID: string; categoryID: string } | null>(null);
    const [products, setProducts] = useState<Product[] | null>(null);

    useEffect(() => {
        const fetchCategoriesWithBrands = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${config.API_URL}/api/StockManager/categoriesBrands`);
                if (!response.ok) throw new Error("Failed to fetch categories.");
                const data = await response.json();
                setCategories(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoriesWithBrands();
    }, []);

    const fetchProductsByBrandAndCategory = async (brandID: string, categoryID: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${config.API_URL}/api/StockManager/products-by-brand-and-category?brandId=${brandID}&categoryId=${categoryID}`
            );
            if (!response.ok) throw new Error("Failed to fetch products.");
            const data = await response.json();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBrandClick = (brandID: string, categoryID: string) => {
        setSelectedBrand({ brandID, categoryID });
        fetchProductsByBrandAndCategory(brandID, categoryID);
    };

    return (
        <div className="products-container">
            <Categories
                categories={categories}
                selectedBrand={selectedBrand}
                onBrandClick={handleBrandClick}
            />
            <ProductGrid
                products={products}
                loading={loading}
                error={error}
                selectedBrand={selectedBrand}
            />
        </div>
    );
};

export default Products;
