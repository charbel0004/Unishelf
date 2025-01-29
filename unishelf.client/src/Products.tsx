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
                                    className={`brand-item ${selectedBrand?.brandID === brand.brandID ? "active" : ""}`}
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

const Products: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedBrand, setSelectedBrand] = useState<{ brandID: string; categoryID: string } | null>(null);
    const [products, setProducts] = useState<Product[] | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
    const [productCache, setProductCache] = useState<{ [key: string]: ProductDetails }>({});

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

    const fetchProductDetails = async (productID: string) => {
        // Prevent fetching if the product is already in cache
        if (productCache[productID]) {
            setSelectedProduct(productCache[productID]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/GetProductDetails/${productID}`);
            if (!response.ok) throw new Error("Failed to fetch product details.");
            const data = await response.json();
            setProductCache((prevCache) => ({ ...prevCache, [productID]: data }));
            setSelectedProduct(data);
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

    const handleProductClick = (productID: string) => {
        fetchProductDetails(productID);
    };

    const closeOverlay = (event: React.MouseEvent) => {
        if ((event.target as HTMLElement).classList.contains("overlay")) {
            setSelectedProduct(null);
        }
    };

    return (
        <div className="products-container">
            <Categories
                categories={categories}
                selectedBrand={selectedBrand}
                onBrandClick={handleBrandClick}
            />

            <div className="products-grid">
                {error && <p className="error">{error}</p>}
                {!selectedBrand && <p>Select a brand to view products.</p>}
                {products && products.length === 0 && <p>No products available for this brand and category.</p>}
                {products?.map((product) => (
                    <div key={product.productID} className="product-card" onClick={() => handleProductClick(product.productID)}>
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

            {/* Overlay */}
            {selectedProduct && (
                <div className="overlay" onClick={closeOverlay}>
                    <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={() => setSelectedProduct(null)}>X</button>

                        <input type="hidden" value={selectedProduct.productID} />

                        <div className="overlay-images">
                            <img
                                src={selectedProduct.images?.length > 0
                                    ? `data:image/png;base64,${selectedProduct.images[0]}`
                                    : "/placeholder.png"}
                                alt="Main"
                                className="main-image"
                            />
                            <div className="image-thumbnails">
                                {selectedProduct.images?.slice(1).map((img, index) => (
                                    <img
                                        key={index}
                                        src={`data:image/png;base64,${img}`}
                                        alt={`Thumbnail ${index}`}
                                        className="thumbnail"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="overlay-info">
                            <h2>{selectedProduct.productName}</h2>
                            <p><strong>Category:</strong> {selectedProduct.categoryName}</p>
                            <p><strong>Brand:</strong> {selectedProduct.brandName}</p>
                            <p><strong>Description:</strong> {selectedProduct.description}</p>
                            <p><strong>Price per m²:</strong> ${selectedProduct.pricePerMsq}</p>
                            <p><strong>Qty per box:</strong> {selectedProduct.qtyPerBox}</p>
                            <p><strong>Sqm per box:</strong> {selectedProduct.sqmPerBox} m²</p>
                            <p><strong>Quantity:</strong> {selectedProduct.quantity}</p>
                            <p><strong>Available:</strong> {selectedProduct.available ? "Yes" : "No"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
