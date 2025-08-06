import { useParams, Link } from 'react-router-dom';
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

interface ProductDetails {
    productID: string | null;
    productName: string;
    brandName: string;
    categoryName: string;
    description: string;
    quantity: number | '';
    currency: string;
    price: number | '';
    pricePerMsq: number | '';
    height: number | '';
    width: number | '';
    depth: number | '';
    sqmPerBox: number | '';
    qtyPerBox: number | '';
    available: boolean;
    images: { imageID: string; imageData: string }[];
}

interface CartProduct {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
    currency: string;
}

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div
            className={`allProducts-toast allProducts-toast-${type}`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            {message}
        </div>
    );
};

const sessionCart = {
    get: (): CartProduct[] => {
        const cart = sessionStorage.getItem('cart');
        const items = cart ? JSON.parse(cart) : [];
        const normalizedItems = items.map((item: CartProduct) => ({
            ...item,
            currency: item.currency || 'USD',
        }));
        const mergedItems = normalizedItems.reduce((acc: CartProduct[], item: CartProduct) => {
            const existingItem = acc.find((i) => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                return acc;
            }
            return [...acc, item];
        }, []);
        console.log('Retrieved sessionCart:', mergedItems.map(i => ({ id: i.id, name: i.name })));
        return mergedItems;
    },
    set: (cart: CartProduct[]) => {
        const normalizedCart = cart.map((item) => ({
            ...item,
            currency: item.currency || 'USD',
        }));
        const mergedCart = normalizedCart.reduce((acc: CartProduct[], item: CartProduct) => {
            const existingItem = acc.find((i) => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                return acc;
            }
            return [...acc, item];
        }, []);
        console.log('Saving to sessionCart:', mergedCart.map(i => ({ id: i.id, name: i.name })));
        sessionStorage.setItem('cart', JSON.stringify(mergedCart));
    },
    add: (item: CartProduct) => {
        if (!item.id || item.id.length < 10) {
            console.warn('Invalid product ID:', item.id);
            return;
        }
        const currentCart = sessionCart.get();
        const newItem = {
            ...item,
            currency: item.currency || 'USD',
        };
        const updatedCart = [...currentCart, newItem];
        sessionCart.set(updatedCart);
    },
    clear: () => {
        console.log('Clearing sessionCart');
        sessionStorage.removeItem('cart');
    },
};

const ImageSlider: React.FC<{ images: string[]; productName: string }> = ({ images, productName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [autoPlayDone, setAutoPlayDone] = useState(false);

    const nextSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
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

    const prevSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    useEffect(() => {
        if (images.length > 1 && !autoPlayDone) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            timerRef.current = setInterval(() => {
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
            }, 2000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };
        }
    }, [images.length, autoPlayDone]);

    const handleDotClick = (index: number, e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        setCurrentIndex(index);
    };

    return (
        <div className="allProducts-slider-wrapper">
            <div className="allProducts-slider-controls">
                {images.length > 1 && (
                    <button
                        className="allProducts-slider-arrow left"
                        onClick={prevSlide}
                        aria-label="Previous slide"
                    >
                        ❮
                    </button>
                )}
                <div
                    className="allProducts-slider-container"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {images.map((image, idx) => (
                        <div key={idx} className="allProducts-slider-slide">
                            <img
                                src={`data:image/jpeg;base64,${image}`}
                                alt={`Product ${productName} image ${idx + 1}`}
                                className="allProducts-slider-image"
                            />
                        </div>
                    ))}
                </div>
                {images.length > 1 && (
                    <button
                        className="allProducts-slider-arrow right"
                        onClick={nextSlide}
                        aria-label="Next slide"
                    >
                        ❯
                    </button>
                )}
            </div>

            {images.length > 1 && (
                <div className="allProducts-slider-dots">
                    {images.map((_, idx) => (
                        <span
                            key={idx}
                            className={`allProducts-dot ${idx === currentIndex ? 'active' : ''}`}
                            onClick={(e) => handleDotClick(idx, e)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Go to slide ${idx + 1}`}
                            onKeyDown={(e) => e.key === 'Enter' && setCurrentIndex(idx)}
                        ></span>
                    ))}
                </div>
            )}
        </div>
    );
};

const AllProducts: React.FC = () => {
    const { brandID, categoryID } = useParams<{ brandID?: string; categoryID?: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [surfaceArea, setSurfaceArea] = useState<string>('');
    const [roomWidth, setRoomWidth] = useState<string>('');
    const [roomHeight, setRoomHeight] = useState<string>('');
    const [calculatedBoxes, setCalculatedBoxes] = useState<number>(1);
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const lastAddRef = useRef<string | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    };

    const handleCloseToast = () => {
        setToast(null);
    };

    useEffect(() => {
        // Clear stale cart data on component mount
        sessionCart.clear();
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = config.getDecodedToken();
                const userId = decodedToken['UserID'] || null;
                setUserId(userId);
                if (!userId) {
                    console.warn('UserID is null in decoded token:', decodedToken);
                }
            } catch (err) {
                console.error('Error decoding token:', err);
                setUserId(null);
            }
        } else {
            console.warn('No token found in localStorage');
            setUserId(null);
        }
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!brandID || !categoryID) {
                setError('Brand or Category ID is missing in the URL.');
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(
                    `${config.API_URL}/api/StockManager/active-products-by-brand-and-category?brandId=${brandID}&categoryId=${categoryID}`
                );
                if (!response.ok) {
                    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
                }
                const data: Product[] = await response.json();
                console.log('Fetched products:', data.map(p => ({ productID: p.productID, productName: p.productName })));
                setProducts(data);
                setFilteredProducts(data);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Unable to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [brandID, categoryID]);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = products.filter(
            (product) =>
                product.productName.toLowerCase().includes(lowerTerm) ||
                product.description.toLowerCase().includes(lowerTerm)
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    useEffect(() => {
        if (selectedProduct?.images?.length) {
            setMainImage(selectedProduct.images[0]?.imageData || null);
        } else {
            setMainImage(null);
        }
    }, [selectedProduct]);

    const fetchProductDetails = async (productID: string) => {
        if (!productID || productID.length < 10) {
            console.warn('Invalid productID:', productID);
            setDetailsError('Invalid product ID provided.');
            return;
        }

        setDetailsLoading(true);
        setDetailsError(null);
        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/GetProductDetails/${productID}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch product details: ${response.status} ${response.statusText}`);
            }

            const productData = await response.json();
            console.log('Fetched product details:', { productID: productData.ProductID, productName: productData.ProductName });

            if (!productData || productData.Error) {
                throw new Error(productData.Error || 'Product not found.');
            }

            const getValue = (obj: any, keys: string[]): string | number | boolean | null => {
                for (const key of keys) {
                    if (obj[key] !== undefined && obj[key] !== null) {
                        return obj[key];
                    }
                }
                return '';
            };

            const imagesArray = getValue(productData, ['Images', 'images']) || [];
            const processedImages = Array.isArray(imagesArray)
                ? imagesArray.map((img: any) => ({
                    imageID: getValue(img, ['ImageID', 'imageID', 'id']) as string || '',
                    imageData: getValue(img, ['ImageData', 'imageData', 'data']) as string || '',
                }))
                : [];

            const processedData: ProductDetails = {
                productID: getValue(productData, ['ProductID', 'productID', 'id']) as string | null,
                productName: getValue(productData, ['ProductName', 'productName']) as string || '',
                brandName: getValue(productData, ['BrandName', 'brandName']) as string || '',
                categoryName: getValue(productData, ['CategoryName', 'categoryName']) as string || '',
                description: getValue(productData, ['Description', 'description']) as string || '',
                quantity: getValue(productData, ['Quantity', 'quantity']) !== 0 ? getValue(productData, ['Quantity', 'quantity']) as number : '',
                currency: getValue(productData, ['Currency', 'currency']) as string || 'USD',
                price: getValue(productData, ['Price', 'price']) !== 0 ? getValue(productData, ['Price', 'price']) as number : '',
                pricePerMsq: getValue(productData, ['PricePerMsq', 'pricePerMsq']) !== 0 ? getValue(productData, ['PricePerMsq', 'pricePerMsq']) as number : '',
                height: getValue(productData, ['Height', 'height']) !== 0 ? getValue(productData, ['Height', 'height']) as number : '',
                width: getValue(productData, ['Width', 'width']) !== 0 ? getValue(productData, ['Width', 'width']) as number : '',
                depth: (typeof getValue(productData, ['Depth', 'depth']) === 'number' && getValue(productData, ['Depth', 'depth']) > 0) ? getValue(productData, ['Depth', 'depth']) as number : '',
                sqmPerBox: getValue(productData, ['SqmPerBox', 'sqmPerBox']) !== 0 ? getValue(productData, ['SqmPerBox', 'sqmPerBox']) as number : '',
                qtyPerBox: getValue(productData, ['QtyPerBox', 'qtyPerBox']) !== 0 ? getValue(productData, ['QtyPerBox', 'qtyPerBox']) as number : '',
                available: getValue(productData, ['Available', 'available']) as boolean ?? false,
                images: processedImages,
            };

            setSelectedProduct(processedData);
            setDetailsError(null);
            setSurfaceArea('');
            setRoomWidth('');
            setRoomHeight('');
            setCalculatedBoxes(1);
        } catch (err: any) {
            console.error('Error fetching product details:', err);
            setDetailsError('Unable to load product details. Please try again.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleProductClick = (productID: string) => {
        fetchProductDetails(productID);
    };

    const handleCloseOverlay = () => {
        setSelectedProduct(null);
        setDetailsError(null);
        setSurfaceArea('');
        setRoomWidth('');
        setRoomHeight('');
        setCalculatedBoxes(1);
        setMainImage(null);
    };

    const calculateRequiredBoxes = () => {
        if (!selectedProduct || !selectedProduct.sqmPerBox || selectedProduct.sqmPerBox === '' || selectedProduct.quantity === '') {
            setCalculatedBoxes(1);
            return;
        }

        let totalSqm = 0;
        if (surfaceArea && parseFloat(surfaceArea) > 0) {
            totalSqm = parseFloat(surfaceArea);
        } else if (roomWidth && roomHeight && parseFloat(roomWidth) > 0 && parseFloat(roomHeight) > 0) {
            totalSqm = (parseFloat(roomWidth) * parseFloat(roomHeight)) / 10000;
        } else {
            setCalculatedBoxes(1);
            return;
        }

        const baseBoxesNeeded = totalSqm / Number(selectedProduct.sqmPerBox);
        const boxesWithExtra = Math.ceil(baseBoxesNeeded * 1.1);
        setCalculatedBoxes(boxesWithExtra);
    };

    const clearCalculator = () => {
        setSurfaceArea('');
        setRoomWidth('');
        setRoomHeight('');
        setCalculatedBoxes(1);
    };

    const formatNumberWithSpaces = (num: number): string => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const handleQuantityChange = (newValue: number) => {
        if (newValue <= 0) {
            setCalculatedBoxes(1);
            return;
        }
        if (selectedProduct?.quantity !== '' && newValue > Number(selectedProduct.quantity)) {
            showToast('Requested quantity exceeds available stock.', 'error');
            return;
        }
        setCalculatedBoxes(newValue);
    };

    const addToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (isAddingToCart) {
            console.log('Duplicate addToCart attempt blocked: already adding');
            return;
        }

        if (!selectedProduct || !calculatedBoxes || calculatedBoxes <= 0) {
            console.warn('Invalid cart addition: missing product or quantity');
            showToast('Please select a valid quantity before adding to cart.', 'error');
            return;
        }

        if (!selectedProduct.productID || selectedProduct.productID.length < 10) {
            console.warn('Invalid cart addition: missing or invalid productID', selectedProduct.productID);
            showToast('Cannot add to cart: Product ID is invalid.', 'error');
            return;
        }

        const pricePerBox =
            selectedProduct.price !== '' && Number(selectedProduct.price) > 0
                ? Number(selectedProduct.price)
                : selectedProduct.pricePerMsq !== '' && selectedProduct.sqmPerBox !== '' && Number(selectedProduct.pricePerMsq) > 0
                    ? Number(selectedProduct.sqmPerBox) * Number(selectedProduct.pricePerMsq)
                    : 0;

        if (pricePerBox === 0) {
            console.warn('Invalid cart addition: missing price information');
            showToast('Cannot add to cart: Price information is missing.', 'error');
            return;
        }

        const cartProduct: CartProduct = {
            id: selectedProduct.productID,
            name: selectedProduct.productName,
            price: pricePerBox,
            quantity: calculatedBoxes,
            image: selectedProduct.images?.[0]?.imageData || null,
            currency: selectedProduct.currency,
        };

        const requestId = `${userId || 'guest'}-${selectedProduct.productID}-${calculatedBoxes}-${Date.now()}`;
        if (lastAddRef.current === requestId) {
            console.log('Duplicate addToCart attempt blocked: same request ID', requestId);
            return;
        }
        lastAddRef.current = requestId;

        if (debounceTimeoutRef.current) {
            console.log('Duplicate addToCart attempt blocked: debounce active');
            return;
        }
        debounceTimeoutRef.current = setTimeout(() => {
            debounceTimeoutRef.current = null;
        }, 500);

        console.log('Adding to cart:', { encryptedUserId: userId, encryptedProductId: selectedProduct.productID, quantity: calculatedBoxes });
        setIsAddingToCart(true);
        try {
            if (userId) {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.warn('No token found for logged-in user');
                    throw new Error('Authentication token is missing.');
                }
                const response = await fetch(`${config.API_URL}/api/Cart/Add`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        encryptedUserId: userId,
                        encryptedProductId: selectedProduct.productID,
                        quantity: calculatedBoxes,
                    }),
                });
                const data = await response.json();
                if (!response.ok) {
                    console.error('Failed to add to cart:', data);
                    showToast(`Failed to add item to cart: ${data.error || 'Unknown error'}`, 'error');
                    return;
                }
                console.log('Cart add response:', data);
                window.dispatchEvent(new Event('cartUpdated'));
                showToast(`${calculatedBoxes} box${calculatedBoxes > 1 ? 'es' : ''} of ${selectedProduct.productName} added to cart!`, 'success');
                handleCloseOverlay();
            } else {
                console.log('User not logged in, adding to session cart');
                sessionCart.add(cartProduct);
                showToast(`${calculatedBoxes} box${calculatedBoxes > 1 ? 'es' : ''} of ${selectedProduct.productName} added to cart!`, 'success');
                handleCloseOverlay();
            }
        } catch (err: any) {
            console.error('Error adding to cart:', err);
            showToast(`Error adding item to cart: ${err.message || 'Please try again.'}`, 'error');
        } finally {
            setIsAddingToCart(false);
            lastAddRef.current = null;
        }
    };

    const handleThumbnailClick = (imageData: string) => {
        setMainImage(imageData);
    };

    const isSurfaceAreaDisabled = roomWidth !== '' || roomHeight !== '';
    const areDimensionsDisabled = surfaceArea !== '';

    const isProductOutOfStock = (product: ProductDetails): boolean => {
        return product.quantity === 0 || product.quantity === '';
    };

    if (loading) return <div className="allProducts-loading">Loading products...</div>;
    if (error) return <div className="allProducts-error">{error}</div>;

    const brandName = filteredProducts[0]?.brandName || 'Brand';
    const categoryName = filteredProducts[0]?.categoryName || 'Category';

    return (
        <div className="allProducts-page">
            <div className="allProducts-container">
                <h2 className="allProducts-title">
                    Products for <span className="allProducts-brand">{brandName}</span> in{' '}
                    <span className="allProducts-category">{categoryName}</span>
                </h2>
                <div className="allProducts-Breadcrumb">
                    <nav className="allProducts-breadcrumb" aria-label="Breadcrumb">
                        <ol className="allProducts-breadcrumb-list">
                            <li className="allProducts-breadcrumb-item">
                                <Link to="/" className="allProducts-breadcrumb-link">
                                    Home {'>'}
                                </Link>
                                <span className="allProducts-breadcrumb-separator"></span>
                            </li>
                            <li className="allProducts-breadcrumb-item">
                                <Link to={`/AllBrands/${categoryID}`} className="allProducts-breadcrumb-link">
                                    All Brands {'>'}
                                </Link>
                                <span className="allProducts-breadcrumb-separator"></span>
                            </li>
                            <li className="allProducts-breadcrumb-item allProducts-breadcrumb-current">
                                <span>{brandName}</span>
                            </li>
                        </ol>
                    </nav>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="allProducts-search-bar"
                        aria-label="Search products"
                    />
                </div>
                <p className="allProducts-counter">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </p>
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <div
                            key={product.productID}
                            className="allProducts-card"
                            onClick={() => handleProductClick(product.productID)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) =>
                                e.key === 'Enter' && handleProductClick(product.productID)
                            }
                            aria-label={`View details of ${product.productName}`}
                        >
                            {product.images?.length > 0 && (
                                <ImageSlider images={product.images} productName={product.productName} />
                            )}
                            <h3>{product.productName}</h3>
                            <p
                                className="allProducts-quantity"
                                style={{ color: product.quantity === 0 ? 'red' : 'black' }}
                            >
                                {product.quantity === 0
                                    ? 'Out of Stock'
                                    : `Available Quantity: ${product.quantity}`}
                            </p>
                            <p className="allProducts-price">
                                {product.pricePerMsq != null && product.pricePerMsq !== 0
                                    ? `Price per m²: ${product.pricePerMsq} ${product.currency}`
                                    : product.price != null && product.price !== 0
                                        ? `Price: ${product.price} ${product.currency}`
                                        : 'Price: Not available'}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="allProducts-no-products">No products found.</p>
                )}
            </div>

            {selectedProduct && (
                <div className="allProducts-overlay" onClick={handleCloseOverlay}>
                    <div className="allProducts-overlay-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="allProducts-close-button"
                            onClick={handleCloseOverlay}
                            aria-label="Close product details"
                        >
                            X
                        </button>
                        {detailsLoading && <p className="allProducts-loading">Loading product details...</p>}
                        {detailsError && <p className="allProducts-error">{detailsError}</p>}
                        {!detailsLoading && !detailsError && (
                            <div className="allProducts-overlay-inner">
                                <div className="allProducts-overlay-top">
                                    <div className="allProducts-overlay-left">
                                        <div className="allProducts-overlay-images">
                                            <img
                                                src={
                                                    mainImage
                                                        ? `data:image/jpeg;base64,${mainImage}`
                                                        : '/placeholder.png'
                                                }
                                                alt={`Main image of ${selectedProduct.productName}`}
                                                className="allProducts-main-image"
                                            />
                                            <div className="allProducts-thumbnails-grid">
                                                {selectedProduct.images?.length > 0 ? (
                                                    selectedProduct.images.map((img, index) => (
                                                        <div key={index} className="allProducts-thumbnail-wrapper">
                                                            <img
                                                                src={
                                                                    img.imageData
                                                                        ? `data:image/jpeg;base64,${img.imageData}`
                                                                        : '/placeholder.png'
                                                                }
                                                                onClick={() => handleThumbnailClick(img.imageData)}
                                                                className="allProducts-thumbnail"
                                                                alt={`Thumbnail ${index + 1} of ${selectedProduct.productName}`}
                                                                role="button"
                                                                tabIndex={0}
                                                                onKeyDown={(e) =>
                                                                    e.key === 'Enter' && handleThumbnailClick(img.imageData)
                                                                }
                                                            />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="allProducts-no-images">No images available</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="allProducts-overlay-right">
                                        <h3>Product Details</h3>
                                        <div className="allProducts-product-details">
                                            {selectedProduct.productName && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Name:</strong> {selectedProduct.productName}
                                                </div>
                                            )}
                                            {selectedProduct.brandName && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Brand:</strong> {selectedProduct.brandName}
                                                </div>
                                            )}
                                            {selectedProduct.categoryName && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Category:</strong> {selectedProduct.categoryName}
                                                </div>
                                            )}
                                            {selectedProduct.description && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Description:</strong> {selectedProduct.description}
                                                </div>
                                            )}
                                            {selectedProduct.height !== '' && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Height:</strong> {selectedProduct.height} cm
                                                </div>
                                            )}
                                            {selectedProduct.width !== '' && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Width:</strong> {selectedProduct.width} cm
                                                </div>
                                            )}
                                            {selectedProduct.depth !== '' && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Depth:</strong> {selectedProduct.depth} cm
                                                </div>
                                            )}
                                            {selectedProduct.pricePerMsq !== '' && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Price per m²:</strong> {selectedProduct.pricePerMsq} {selectedProduct.currency}
                                                </div>
                                            )}
                                            {selectedProduct.price !== '' && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Price:</strong> {selectedProduct.price} {selectedProduct.currency}
                                                </div>
                                            )}
                                            {selectedProduct.sqmPerBox !== '' && (
                                                <div className="allProducts-detail-item">
                                                    <strong>m² per box:</strong> {selectedProduct.sqmPerBox} m²
                                                </div>
                                            )}
                                            {selectedProduct.qtyPerBox !== '' && (
                                                <div className="allProducts-detail-item">
                                                    <strong>Qty per box:</strong> {selectedProduct.qtyPerBox}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isProductOutOfStock(selectedProduct) && (
                                    <p className="allProducts-out-of-stock">
                                        This product is currently out of stock; it will be available once we restock.
                                    </p>
                                )}
                                {!isProductOutOfStock(selectedProduct) && (
                                    <div className="allProducts-surface-calculator">
                                        <h4>Order Details</h4>
                                        <div className="allProducts-calculator-container">
                                            {selectedProduct.height !== '' &&
                                                selectedProduct.width !== '' &&
                                                selectedProduct.sqmPerBox !== '' && (
                                                    <div className="allProducts-calculator-entry">
                                                        <div className="allProducts-calculator-inputs">
                                                            <label>
                                                                <strong>Total Surface Area (m²):</strong>
                                                                <input
                                                                    type="number"
                                                                    value={surfaceArea}
                                                                    onChange={(e) => {
                                                                        setSurfaceArea(e.target.value);
                                                                        setRoomWidth('');
                                                                        setRoomHeight('');
                                                                    }}
                                                                    placeholder="e.g., 2.3"
                                                                    className="allProducts-full-width-input"
                                                                    step="0.01"
                                                                    aria-label="Total surface area in square meters"
                                                                    disabled={isSurfaceAreaDisabled}
                                                                />
                                                            </label>
                                                            <p>OR</p>
                                                            <label>
                                                                <strong>Room Width (cm):</strong>
                                                                <input
                                                                    type="number"
                                                                    value={roomWidth}
                                                                    onChange={(e) => {
                                                                        setRoomWidth(e.target.value);
                                                                        setSurfaceArea('');
                                                                    }}
                                                                    placeholder="e.g., 230"
                                                                    className="allProducts-full-width-input"
                                                                    aria-label="Room width in centimeters"
                                                                    disabled={areDimensionsDisabled}
                                                                />
                                                            </label>
                                                            <label>
                                                                <strong>Room Height (cm):</strong>
                                                                <input
                                                                    type="number"
                                                                    value={roomHeight}
                                                                    onChange={(e) => {
                                                                        setRoomHeight(e.target.value);
                                                                        setSurfaceArea('');
                                                                    }}
                                                                    placeholder="e.g., 120"
                                                                    className="allProducts-full-width-input"
                                                                    aria-label="Room height in centimeters"
                                                                    disabled={areDimensionsDisabled}
                                                                />
                                                            </label>
                                                            <div className="allProducts-calculator-buttons">
                                                                <button
                                                                    onClick={calculateRequiredBoxes}
                                                                    className="allProducts-calculate-button"
                                                                    disabled={detailsLoading}
                                                                    aria-label="Calculate required boxes with 10% extra"
                                                                >
                                                                    Calculate
                                                                </button>
                                                                <button
                                                                    onClick={clearCalculator}
                                                                    className="allProducts-clear-button"
                                                                    aria-label="Clear calculator inputs and reset quantity"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            <div className="allProducts-calculator-results">
                                                <div className="allProducts-calculation-result">
                                                    <p>
                                                        <strong>Quantity:</strong>
                                                        <div className="allProducts-quantity-controls">
                                                            <button
                                                                onClick={() =>
                                                                    handleQuantityChange(calculatedBoxes - 1)
                                                                }
                                                                className="allProducts-quantity-button"
                                                                disabled={calculatedBoxes <= 1}
                                                                aria-label="Decrease quantity"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={calculatedBoxes}
                                                                onChange={(e) =>
                                                                    handleQuantityChange(Number(e.target.value))
                                                                }
                                                                className="allProducts-quantity-input"
                                                                aria-label="Quantity of boxes"
                                                                min="1"
                                                                max={selectedProduct.quantity || undefined}
                                                            />
                                                            <button
                                                                onClick={() =>
                                                                    handleQuantityChange(calculatedBoxes + 1)
                                                                }
                                                                className="allProducts-quantity-button"
                                                                disabled={
                                                                    selectedProduct.quantity !== '' &&
                                                                    calculatedBoxes >= Number(selectedProduct.quantity)
                                                                }
                                                                aria-label="Increase quantity"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </p>
                                                    {selectedProduct.quantity !== '' &&
                                                        calculatedBoxes > Number(selectedProduct.quantity) && (
                                                            <p className="allProducts-insufficient-stock">
                                                                Our stock does not have the needed amount.
                                                            </p>
                                                        )}
                                                    {(selectedProduct.pricePerMsq !== '' ||
                                                        selectedProduct.price !== '') && (
                                                            <p>
                                                                <strong>Total Price:</strong>{' '}
                                                                {selectedProduct.price !== '' && Number(selectedProduct.price) > 0
                                                                    ? formatNumberWithSpaces(
                                                                        Number(
                                                                            (
                                                                                calculatedBoxes *
                                                                                Number(selectedProduct.price)
                                                                            ).toFixed(2)
                                                                        )
                                                                    )
                                                                    : selectedProduct.pricePerMsq !== '' && selectedProduct.sqmPerBox !== ''
                                                                        ? formatNumberWithSpaces(
                                                                            Number(
                                                                                (
                                                                                    calculatedBoxes *
                                                                                    Number(selectedProduct.sqmPerBox) *
                                                                                    Number(selectedProduct.pricePerMsq)
                                                                                ).toFixed(2)
                                                                            )
                                                                        )
                                                                        : 'N/A'}{' '}
                                                                {selectedProduct.currency}
                                                            </p>
                                                        )}
                                                    <button
                                                        onClick={addToCart}
                                                        className="allProducts-add-to-cart-button"
                                                        disabled={
                                                            isAddingToCart ||
                                                            detailsLoading ||
                                                            (selectedProduct.quantity !== '' &&
                                                                calculatedBoxes > Number(selectedProduct.quantity))
                                                        }
                                                        aria-label={`Add ${calculatedBoxes} boxes of ${selectedProduct.productName} to cart`}
                                                    >
                                                        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={handleCloseToast}
                    duration={3000}
                />
            )}
        </div>
    );
};

export default AllProducts;