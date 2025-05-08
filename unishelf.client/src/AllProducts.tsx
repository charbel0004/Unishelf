import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import './css/AllProducts.css';
import config from './config';

interface Product {
    productID: string;
    productName: string;
    brandName: string;
    categoryName: string;
    description: string;
    quantity: number;
    brandID: string;
    currency: string;
    price: number;
    pricePerMsq: number;
    categoryID: string;
    images: string[];
}


const ImageSlider: React.FC<{ images: string[]; productName: string }> = ({ images, productName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [autoPlayDone, setAutoPlayDone] = useState(false);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= images.length) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setAutoPlayDone(true);
                return prevIndex;
            }
            return nextIndex;
        });
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    useEffect(() => {
        if (images.length > 1 && !autoPlayDone) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            timerRef.current = setInterval(nextSlide, 2000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };
        }
    }, [images.length, autoPlayDone]);

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div className="slider-wrapper">
            <div className="slider-controls">
                <button className="slider-arrow left" onClick={prevSlide}>&#10094;</button>
                <div
                    className="slider-container"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {images.map((image, idx) => (
                        <div key={idx} className="slider-slide">
                            <img
                                src={`data:image/jpeg;base64,${image}`}
                                alt={`Product ${productName} image ${idx + 1}`}
                                width="200"
                                className="slider-image"
                            />
                        </div>
                    ))}
                </div>
                <button className="slider-arrow right" onClick={nextSlide}>&#10095;</button>
            </div>

            {images.length > 1 && (
                <div className="slider-dots">
                    {images.map((_, idx) => (
                        <span
                            key={idx}
                            className={`dot ${idx === currentIndex ? 'active' : ''}`}
                            onClick={() => handleDotClick(idx)}
                        ></span>
                    ))}
                </div>
            )}
        </div>
    );
};


const AllProducts: React.FC = () => {
    const { brandID, categoryID } = useParams<{ brandID?: string; categoryID?: string }>();
    const location = useLocation();

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
      
        const fetchProducts = async () => {
            if (!brandID || !categoryID) return;

            try {
                const response = await fetch(
                    `${config.API_URL}/api/StockManager/active-products-by-brand-and-category?brandId=${brandID}&categoryId=${categoryID}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: Product[] = await response.json();
                setProducts(data);
                setFilteredProducts(data);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError("Failed to fetch products.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [brandID, categoryID]);


    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = products.filter(product =>
            product.productName.toLowerCase().includes(lowerTerm) ||
            product.description.toLowerCase().includes(lowerTerm)
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="all-products-page">
            <div className="all-products-container">
                <h2 className="allproduct-title">
                    Products for{" "}
                    <span style={{ color: "#007acc" }}>
                        {filteredProducts[0]?.brandName || "Brand"}
                    </span>{" "}
                    in{" "}
                    <span style={{ color: "#007acc" }}>
                        {filteredProducts[0]?.categoryName || "Category"}
                    </span>
                </h2>


                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="allproducts-search-bar"
                />

                <p className="allproducts-counter">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
                </p>

                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <div key={product.productID} className="allproduct-card">
                            

                            {product.images?.length > 0 && (
                                <ImageSlider images={product.images} productName={product.productName} />
                            )}
                            <h3>{product.productName}</h3>
                            <p
                                className="allproduct-quantity"
                                style={{ color: product.quantity === 0 ? 'red' : 'black' }}
                            >
                                {product.quantity === 0
                                    ? 'Out of Stock'
                                    : `Available Quantity: ${product.quantity}`}
                            </p>

                            <p className="allproducts-price">
                                {product.pricePerMsq != null && product.pricePerMsq !== 0
                                    ? `Price per msq: ${product.pricePerMsq} ${product.currency}`
                                    : product.price != null && product.price !== 0
                                        ? `Price: ${product.price} ${product.currency}`
                                        : 'Price: Not available'}
                            </p>




                        </div>
                    ))
                ) : (
                    <p>No products found.</p>
                )}
            </div>
        </div>
    );
};

export default AllProducts;
