import React, { useEffect, useState } from "react";
import "./css/Products.css";
import config from "./config";

interface Category {
    categoryID: string;
    categoryName: string;
    brands: Brand[];
}

interface SimpleCategory {
    categoryID: string;
    categoryName: string;
}

interface Brand {
    brandID: string;
    brandName: string;
    brandImageBase64?: string;
}

interface Product {
    productID: string;
    productName: string;
    quantity: number;
    images: string[];
}

interface ProductDetails {
    productID: string | null;
    productName: string | null;
    categoryID: string;
    categoryName: string;
    brandID: string;
    brandName: string;
    description: string | null;
    height: number | null;
    width: number | null;
    depth: number | null;
    pricePerMsq: number | null;
    price: number | null;
    currency: string | null;
    sqmPerBox: number | null;
    qtyPerBox: number | null;
    quantity: number | null;
    available: boolean;
    images: { imageID: string; imageData: string }[];
}

const Categories: React.FC<{
    categories: Category[];
    selectedBrand: { brandID: string; categoryID: string } | null;
    onBrandClick: (brandID: string, categoryID: string) => void;
}> = ({ categories, selectedBrand, onBrandClick }) => {
    return (
        <nav className="categories-navbar">
            <ul>
                {categories.length === 0 ? (
                    <li>No categories available</li>
                ) : (
                    categories.map((category) => (
                        <li key={category.categoryID} className="category-item">
                            <h3>{category.categoryName || "Unnamed Category"}</h3>
                            <ul className="brands-list">
                                {category.brands.length === 0 ? (
                                    <li>No brands available</li>
                                ) : (
                                    category.brands.map((brand) => (
                                        <li
                                            key={`${category.categoryID}-${brand.brandID}`}
                                            className={`brand-item ${selectedBrand?.brandID === brand.brandID ? "active" : ""}`}
                                            onClick={() => onBrandClick(brand.brandID, category.categoryID)}
                                        >
                                            <img
                                                src={
                                                    brand.brandImageBase64
                                                        ? `data:image/png;base64,${brand.brandImageBase64}`
                                                        : "/default-brand-image.png"
                                                }
                                                alt={brand.brandName}
                                                className="brand-image"
                                            />
                                            {brand.brandName || "Unnamed Brand"}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </li>
                    ))
                )}
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
    const [editableProduct, setEditableProduct] = useState<ProductDetails | null>(null);
    const [newProductImages, setNewProductImages] = useState<string[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [productCategories, setProductCategories] = useState<SimpleCategory[]>([]);
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const isFormValid = (): boolean => {
        if (!editableProduct) return false;
        return (
            !!editableProduct.categoryID &&
            !!editableProduct.brandID &&
            !!editableProduct.productName?.trim()
        );
    };

    const fetchCategoriesWithBrands = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/categoriesBrands`);
            if (!response.ok) throw new Error(`Failed to fetch categories: HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Invalid categories data format.");
            setCategories(data.map((item: any) => ({
                categoryID: item.categoryID || item.CategoryID,
                categoryName: item.categoryName || item.CategoryName,
                brands: item.brands.map((brand: any) => ({
                    brandID: brand.brandID || brand.BrandID,
                    brandName: brand.brandName || brand.BrandName,
                    brandImageBase64: brand.brandImageBase64 || brand.BrandImageBase64,
                })),
            })));
        } catch (err: any) {
            setError("Unable to load categories. Please try again.");
            console.error("Error fetching categories:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrandsAndCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const [brandResponse, categoryResponse] = await Promise.all([
                fetch(`${config.API_URL}/api/StockManager/GetActiveBrands`),
                fetch(`${config.API_URL}/api/StockManager/GetActiveCategories`),
            ]);

            if (!brandResponse.ok) throw new Error(`Failed to fetch brands: HTTP ${brandResponse.status}`);
            if (!categoryResponse.ok) throw new Error(`Failed to fetch categories: HTTP ${categoryResponse.status}`);

            const brandData = await brandResponse.json();
            const categoryData = await categoryResponse.json();

            const mappedCategories = Array.isArray(categoryData)
                ? categoryData.map((item: any) => ({
                    categoryID: item.categoryID || item.CategoryID,
                    categoryName: item.categoryName || item.CategoryName,
                }))
                : [];
            setBrands(brandData.map((item: any) => ({
                brandID: item.brandID || item.BrandID,
                brandName: item.brandName || item.BrandName,
            })));
            setProductCategories(mappedCategories);
        } catch (err: any) {
            setError("Unable to load brands and categories. Please try again.");
            console.error("Error fetching brands and categories:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductsByBrandAndCategory = async (brandID: string, categoryID: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${config.API_URL}/api/StockManager/products-by-brand-and-category?brandId=${brandID}&categoryId=${categoryID}`
            );
            if (!response.ok) throw new Error(`Failed to fetch products: HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("Invalid products data format.");
            setProducts(data.map((item: any) => ({
                productID: item.productID || item.ProductID,
                productName: item.productName || item.ProductName || "Unnamed Product",
                quantity: item.quantity || item.Quantity || 0,
                images: item.images || item.Images || [],
            })));
            setSearchQuery(""); // Reset search query when fetching new products
        } catch (err: any) {
            setError("Unable to load products. Please try again.");
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategoriesWithBrands();
        fetchBrandsAndCategories();
    }, []);

    useEffect(() => {
        if (editableProduct?.productID && selectedProduct?.images?.length > 0) {
            const firstImage = selectedProduct.images[0].imageData;
            setMainImage(firstImage || null);
        } else if (!editableProduct?.productID && newProductImages.length > 0) {
            setMainImage(newProductImages[0]);
        } else {
            setMainImage(null);
        }
    }, [selectedProduct, newProductImages, editableProduct]);

    const fetchProductDetails = async (productID: string) => {
        if (!productID) {
            setDetailsError("Invalid product ID.");
            return;
        }

        setLoading(true);
        setDetailsError(null);
        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/GetProductDetails/${productID}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch product details: ${response.status} ${response.statusText}`);
            }

            const productData = await response.json();

            if (!productData || productData.Error) {
                throw new Error(productData.Error || "Product not found.");
            }

            const imagesArray = productData.images || productData.Images || [];
            const processedImages = Array.isArray(imagesArray)
                ? imagesArray.map((img: any) => ({
                    imageID: img.imageID || img.ImageID || img.id || "",
                    imageData: img.imageData || img.ImageData || img.data || "",
                }))
                : [];

            let categoryID = productData.categoryID || productData.CategoryID || "";
            let categoryName = productData.categoryName || productData.CategoryName || "";

            if (!categoryID || !productCategories.some((cat) => cat.categoryID === categoryID)) {
                const matchingCategory = productCategories.find(
                    (cat) => cat.categoryName === (productData.categoryName || productData.CategoryName)
                );
                if (matchingCategory) {
                    categoryID = matchingCategory.categoryID;
                    categoryName = matchingCategory.categoryName;
                } else {
                    console.warn(
                        `No matching category found for product ${productID}. CategoryName: ${categoryName}, Available categories:`,
                        productCategories
                    );
                    categoryID = "";
                    categoryName = categoryName || "Unknown";
                }
            }

            const processedData: ProductDetails = {
                productID: productData.productID || productData.ProductID || null,
                productName: productData.productName || productData.ProductName || null,
                categoryID,
                categoryName,
                brandID: productData.brandID || productData.BrandID || "",
                brandName: productData.brandName || productData.BrandName || "",
                description: productData.description || productData.Description || null,
                height: productData.height === 0 ? null : productData.height ?? null,
                width: productData.width === 0 ? null : productData.width ?? null,
                depth: productData.depth === 0 ? null : productData.depth ?? null,
                pricePerMsq: productData.pricePerMsq === 0 ? null : productData.pricePerMsq ?? null,
                price: productData.price === 0 ? null : productData.price ?? null,
                currency: productData.currency || productData.Currency || null,
                sqmPerBox: productData.sqmPerBox === 0 ? null : productData.sqmPerBox ?? null,
                qtyPerBox: productData.qtyPerBox === 0 ? null : productData.qtyPerBox ?? null,
                quantity: productData.quantity === 0 ? null : productData.quantity ?? null,
                available: productData.available || productData.Available || false,
                images: processedImages,
            };

            setSelectedProduct(processedData);
            setEditableProduct(processedData);
            setDetailsError(null);
        } catch (err: any) {
            console.error("Error fetching product details:", err);
            setDetailsError("Failed to load product details. Please try again.");
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
        setIsPriceManuallyEdited(false);
    };

    const handleCloseOverlay = () => {
        setSelectedProduct(null);
        setEditableProduct(null);
        setNewProductImages([]);
        setMainImage(null);
        setDetailsError(null);
        setIsPriceManuallyEdited(false);
    };

    const formatNumber = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return "";
        return String(value);
    };

    const parseFloatValue = (value: string): number | null => {
        if (value === "") return null;
        const cleanValue = value.replace(/,/g, "");
        const num = parseFloat(cleanValue);
        return isNaN(num) ? null : num;
    };

    const parseIntValue = (value: string): number | null => {
        if (value === "") return null;
        const cleanValue = value.replace(/,/g, "");
        const num = parseInt(cleanValue, 10);
        return isNaN(num) ? null : num;
    };

    const calculatePrice = (pricePerMsq: number | null, sqmPerBox: number | null): number | null => {
        if (pricePerMsq === null || sqmPerBox === null) return null;
        const price = Number(pricePerMsq) * Number(sqmPerBox);
        return isNaN(price) ? null : price;
    };

    const handleInputChange = (field: keyof ProductDetails, value: string) => {
        setEditableProduct((prev) => {
            if (!prev) return null;

            let parsedValue: any = value;

            const intFields: (keyof ProductDetails)[] = ["height", "width", "depth", "qtyPerBox", "quantity"];
            const floatFields: (keyof ProductDetails)[] = ["pricePerMsq", "price", "sqmPerBox"];
            const stringFields: (keyof ProductDetails)[] = ["productName", "description", "currency"];

            if (intFields.includes(field)) {
                parsedValue = parseIntValue(value);
                if (parsedValue === null && value !== "") {
                    alert(`Invalid input for ${field}. Please enter a valid integer.`);
                    return prev;
                }
            } else if (floatFields.includes(field)) {
                parsedValue = parseFloatValue(value);
                if (parsedValue === null && value !== "") {
                    alert(`Invalid input for ${field}. Please enter a valid number.`);
                    return prev;
                }
            } else if (stringFields.includes(field)) {
                parsedValue = value === "" ? null : value;
            } else {
                parsedValue = value === "" ? null : value;
            }

            if (field === "price") {
                setIsPriceManuallyEdited(true);
            }

            const updatedProduct = { ...prev, [field]: parsedValue };

            if (!isPriceManuallyEdited && (field === "pricePerMsq" || field === "sqmPerBox")) {
                const newPrice = calculatePrice(updatedProduct.pricePerMsq, updatedProduct.sqmPerBox);
                updatedProduct.price = newPrice;
            }

            return updatedProduct;
        });
    };

    const handleToggle = (field: keyof ProductDetails) => {
        setEditableProduct((prev) => (prev ? { ...prev, [field]: !prev[field] } : null));
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            alert("No file selected.");
            return;
        }
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file.");
            return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert("Image size exceeds 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64StringFull = reader.result?.toString();
            const base64StringRaw = base64StringFull?.split(",")[1];

            if (!base64StringRaw) {
                alert("Failed to convert image to Base64.");
                return;
            }

            if (editableProduct?.productID) {
                const payload = {
                    ProductID: editableProduct.productID,
                    Base64Image: base64StringRaw,
                };

                try {
                    const response = await fetch(`${config.API_URL}/api/StockManager/AddImages`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(errorText || "Failed to upload image");
                    }

                    const imageDataFromServer = await response.json();
                    setEditableProduct((prev) => ({
                        ...prev!,
                        images: [
                            ...(prev?.images || []),
                            {
                                imageID: imageDataFromServer.encryptedImageID,
                                imageData: base64StringRaw,
                            },
                        ],
                    }));
                    setNewProductImages((prev) => [...prev, base64StringRaw]);
                    await fetchProductDetails(editableProduct.productID!);
                } catch (error: any) {
                    alert(`Failed to upload image: ${error.message}`);
                }
            } else {
                setNewProductImages((prev) => [...prev, base64StringRaw]);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleDeleteImage = async (img: string | { imageID: string; imageData: string }, isNewProduct: boolean) => {
        if (isNewProduct) {
            setNewProductImages((prev) => prev.filter((image) => image !== img));
        } else {
            const imageObj = img as { imageID: string; imageData: string };
            if (!imageObj.imageID) {
                alert("Cannot delete image: No image ID provided.");
                return;
            }

            try {
                const response = await fetch(`${config.API_URL}/api/Stockcreated by xAI. Manager/DeleteImage/${imageObj.imageID}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || "Failed to delete image");
                }

                setEditableProduct((prev) => ({
                    ...prev!,
                    images: prev?.images?.filter((image) => image.imageID !== imageObj.imageID) || [],
                }));
                if (editableProduct?.productID) {
                    await fetchProductDetails(editableProduct.productID);
                }
            } catch (error: any) {
                alert(`Failed to delete image: ${error.message}`);
            }
        }
    };

    const handleThumbnailClick = (imageData: string) => {
        setMainImage(imageData);
    };

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brandID = e.target.value;
        const selectedBrand = brands.find((brand) => brand.brandID === brandID);
        setEditableProduct((prev) => ({
            ...prev!,
            brandID,
            brandName: selectedBrand?.brandName || "",
        }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoryID = e.target.value;
        const selectedCategory = productCategories.find((category) => category.categoryID === categoryID);
        if (selectedCategory) {
            setEditableProduct((prev) => ({
                ...prev!,
                categoryID: selectedCategory.categoryID,
                categoryName: selectedCategory.categoryName,
            }));
        } else {
            setEditableProduct((prev) => ({
                ...prev!,
                categoryID: "",
                categoryName: "",
            }));
            alert("Please select a valid category.");
        }
    };

    const handleSave = async () => {
        if (!editableProduct) {
            alert("No product data to save.");
            return;
        }

        const validationErrors: string[] = [];
        if (!editableProduct.productName?.trim()) {
            validationErrors.push("Please enter a product name.");
        }
        if (!editableProduct.categoryID) {
            validationErrors.push("Please select a Category.");
        }
        if (!editableProduct.brandID) {
            validationErrors.push("Please select a Brand.");
        }

        if (validationErrors.length > 0) {
            alert(validationErrors.join("\n"));
            return;
        }

        setLoading(true);

        const requestBody = {
            data: {
                productID: editableProduct.productID || null,
                productName: editableProduct.productName || null,
                categoryID: editableProduct.categoryID || null,
                brandID: editableProduct.brandID || null,
                description: editableProduct.description || null,
                height: editableProduct.height ?? null,
                width: editableProduct.width ?? null,
                depth: editableProduct.depth ?? null,
                pricePerMsq: editableProduct.pricePerMsq ?? null,
                price: editableProduct.price ?? null,
                currency: editableProduct.currency || "USD",
                sqmPerBox: editableProduct.sqmPerBox ?? null,
                qtyPerBox: editableProduct.qtyPerBox ?? null,
                quantity: editableProduct.quantity ?? null,
                available: editableProduct.available ?? false,
                imageData: editableProduct.productID ? [] : newProductImages,
            },
        };

        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/AddorUpdateProduct`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(responseText || `Failed to save product: HTTP ${response.status}`);
            }

            if (responseText !== "Product added/updated successfully.") {
                throw new Error(`Unexpected response: ${responseText}`);
            }

            setNewProductImages([]);
            setMainImage(null);
            setIsPriceManuallyEdited(false);

            if (editableProduct.productID) {
                await fetchProductDetails(editableProduct.productID);
            } else {
                setEditableProduct(null);
                setSelectedProduct(null);
            }

            await fetchCategoriesWithBrands();
            await fetchBrandsAndCategories();
            if (selectedBrand) {
                await handleBrandClick(selectedBrand.brandID, selectedBrand.categoryID);
            }
        } catch (error: any) {
            console.error("Error saving product:", error);
            alert(`Failed to save product: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on search query
    const filteredProducts = products?.filter((product) =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="products-container">
            <Categories categories={categories} selectedBrand={selectedBrand} onBrandClick={handleBrandClick} />
            <div className="add-product-button-container">
                {selectedBrand && (
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-bar"
                    />
                )}
                <button
                    onClick={() => {
                        if (productCategories.length === 0) {
                            alert("Cannot add product: No categories available.");
                            return;
                        }
                        setEditableProduct({
                            productID: null,
                            productName: null,
                            categoryID: "",
                            categoryName: "",
                            brandID: "",
                            brandName: "",
                            description: null,
                            height: null,
                            width: null,
                            depth: null,
                            pricePerMsq: null,
                            price: null,
                            currency: null,
                            sqmPerBox: null,
                            qtyPerBox: null,
                            quantity: null,
                            available: false,
                            images: [],
                        });
                        setSelectedProduct(null);
                        setNewProductImages([]);
                        setMainImage(null);
                        setDetailsError(null);
                        setIsPriceManuallyEdited(false);
                    }}
                    className="add-product-button"
                >
                    Add New Product
                </button>
            </div>

            <div className="products-grid">
                {loading && <p>Loading...</p>}
                {error && (
                    <div className="error-container">
                        <p className="error">{error}</p>
                        {selectedBrand && (
                            <button
                                onClick={() => handleBrandClick(selectedBrand.brandID, selectedBrand.categoryID)}
                                className="retry-button"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                )}
                {!selectedBrand && <p>Select a brand to view products.</p>}
                {filteredProducts && filteredProducts.length === 0 && <p>No products match your search.</p>}
                {filteredProducts?.map((product) => (
                    <div
                        key={product.productID}
                        className="product-card"
                        onClick={() => handleProductClick(product.productID)}
                    >
                        <img
                            src={product.images?.length > 0 ? `data:image/png;base64,${product.images[0]}` : "/placeholder.png"}
                            alt={product.productName}
                            className="product-image"
                        />
                        <h4 className="product-name">{product.productName}</h4>
                        <p className="product-quantity">Quantity: {product.quantity}</p>
                    </div>
                ))}
            </div>

            {editableProduct && (
                <div className="overlay" onClick={handleCloseOverlay}>
                    <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-button" onClick={handleCloseOverlay}>X</button>

                        {loading && <p className="loading">Loading product details...</p>}
                        {detailsError && (
                            <div className="error-container">
                                <p className="error">{detailsError}</p>
                                {editableProduct.productID && (
                                    <button
                                        onClick={() => fetchProductDetails(editableProduct.productID!)}
                                        className="retry-button"
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="overlay-left">
                            <div className="overlay-images">
                                <img
                                    src={mainImage ? `data:image/png;base64,${mainImage}` : "/placeholder.png"}
                                    alt="Main"
                                    className="main-image"
                                />
                                <div className="thumbnails-grid">
                                    {newProductImages && !editableProduct?.productID &&
                                        newProductImages.map((imgBase64, index) => (
                                            <div key={index} className="thumbnail-wrapper">
                                                <img
                                                    src={`data:image/png;base64,${imgBase64}`}
                                                    onClick={() => handleThumbnailClick(imgBase64)}
                                                    className="thumbnail"
                                                />
                                                <button
                                                    className="delete-button"
                                                    onClick={() => handleDeleteImage(imgBase64, true)}
                                                >
                                                    ✖
                                                </button>
                                            </div>
                                        ))}
                                    {editableProduct?.images?.length > 0 &&
                                        editableProduct.images.map((img, index) => (
                                            <div key={index} className="thumbnail-wrapper">
                                                <img
                                                    src={
                                                        img.imageData
                                                            ? `data:image/png;base64,${img.imageData}`
                                                            : "/placeholder.png"
                                                    }
                                                    onClick={() => handleThumbnailClick(img.imageData)}
                                                    className="thumbnail"
                                                />
                                                <button
                                                    className="delete-button"
                                                    onClick={() => handleDeleteImage(img, false)}
                                                >
                                                    ✖
                                                </button>
                                            </div>
                                        ))}
                                    <label className="upload-box">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                                        <span>+</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="overlay-right">
                            <label>
                                <strong>Name:</strong><span className="required-star">*</span>
                            </label>
                            <input
                                type="text"
                                value={editableProduct?.productName ?? ""}
                                onChange={(e) => handleInputChange("productName", e.target.value)}
                                className={`full-width-input ${!editableProduct?.productName?.trim() ? "invalid" : ""}`}
                            />

                            <div className="info-grid">
                                <div className="grid-item">
                                    <label>
                                        <strong>Category:</strong><span className="required-star">*</span>
                                    </label>
                                    <select
                                        value={editableProduct?.categoryID || ""}
                                        onChange={handleCategoryChange}
                                        className={`full-width-input ${!editableProduct?.categoryID ? "invalid" : ""}`}
                                    >
                                        <option value="" disabled>
                                            Select a category
                                        </option>
                                        {productCategories.length === 0 ? (
                                            <option value="" disabled>
                                                No categories available
                                            </option>
                                        ) : (
                                            productCategories.map((category) => (
                                                <option key={category.categoryID} value={category.categoryID}>
                                                    {category.categoryName}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className="grid-item">
                                    <label>
                                        <strong>Brand:</strong><span className="required-star">*</span>
                                    </label>
                                    <select
                                        value={editableProduct?.brandID || ""}
                                        onChange={handleBrandChange}
                                        className={`full-width-input ${!editableProduct?.brandID ? "invalid" : ""}`}
                                    >
                                        <option value="" disabled>
                                            Select a Brand
                                        </option>
                                        {brands.length === 0 ? (
                                            <option value="" disabled>
                                                No brands available
                                            </option>
                                        ) : (
                                            brands.map((brand) => (
                                                <option key={brand.brandID} value={brand.brandID}>
                                                    {brand.brandName}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className="grid-item full-width">
                                    <label>
                                        <strong>Description:</strong>
                                    </label>
                                    <textarea
                                        value={editableProduct?.description ?? ""}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        className="full-width-input"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Height(cm):</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.height)}
                                        onChange={(e) => handleInputChange("height", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Width(cm):</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.width)}
                                        onChange={(e) => handleInputChange("width", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Depth:</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.depth)}
                                        onChange={(e) => handleInputChange("depth", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Price per m²:</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.pricePerMsq)}
                                        onChange={(e) => handleInputChange("pricePerMsq", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>m² per box:</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.sqmPerBox)}
                                        onChange={(e) => handleInputChange("sqmPerBox", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Qty per box:</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.qtyPerBox)}
                                        onChange={(e) => handleInputChange("qtyPerBox", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Price:</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.price)}
                                        onChange={(e) => handleInputChange("price", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Currency:</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={editableProduct?.currency || ""}
                                        onChange={(e) => handleInputChange("currency", e.target.value)}
                                        className="full-width-input"
                                    />
                                </div>
                                <div className="grid-item">
                                    <label>
                                        <strong>Quantity:</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(editableProduct?.quantity)}
                                        onChange={(e) => handleInputChange("quantity", e.target.value)}
                                        className="full-width-input no-arrows"
                                    />
                                </div>
                                <div className="grid-item toggle-container">
                                    <label className="toggle-label">
                                        <strong>Available:</strong>
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={editableProduct?.available === true}
                                            onChange={() => handleToggle("available")}
                                        />
                                        <span className="slider"></span>
                                    </div>
                                </div>
                            </div>

                            <div className="save-button-container">
                                <button
                                    className="save-button"
                                    onClick={handleSave}
                                    disabled={loading || !isFormValid()}
                                >
                                    {loading ? "Saving..." : editableProduct?.productID ? "Save Changes" : "Add Product"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;