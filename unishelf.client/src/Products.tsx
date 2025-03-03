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
    const [editableProduct, setEditableProduct] = useState<ProductDetails | null>(null);
    const [newProductImage, setNewProductImage] = useState<string | null>(null);
    const [brands, setBrands] = useState([]);
    const [productCategories, setCategory] = useState([]);
    const [newProductImages, setNewProductImages] = useState<string[]>([]); // Store multiple images
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);


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
        setLoading(true);
        setError(null);
        try {
            const [productResponse, brandResponse, categoryResponse] = await Promise.all([
                fetch(`${config.API_URL}/api/StockManager/GetProductDetails/${productID}`),
                fetch(`${config.API_URL}/api/StockManager/GetActiveBrands`),
                fetch(`${config.API_URL}/api/StockManager/GetActiveCategories`)
            ]);

            if (!productResponse.ok) throw new Error(`Failed to fetch product details. Status: ${productResponse.status}`);
            if (!brandResponse.ok) throw new Error(`Failed to fetch brands. Status: ${brandResponse.status}`);
            if (!categoryResponse.ok) throw new Error(`Failed to fetch categories. Status: ${categoryResponse.status}`);

            const productData = await productResponse.json();
            const brandData = await brandResponse.json();
            const categoryData = await categoryResponse.json();

            // Avoid unnecessary state updates for brands and categories
            setBrands(prevBrands => (JSON.stringify(prevBrands) !== JSON.stringify(brandData) ? brandData : prevBrands));
            setCategory(prevCategories => (JSON.stringify(prevCategories) !== JSON.stringify(categoryData) ? categoryData : prevCategories));

            const selectedBrand = brandData.find((brand: any) => brand.brandName === productData.brandName);
            const selectedCategory = categoryData.find((category: any) => category.categoryName === productData.categoryName);

            const processedData = {
                ...productData,
                Images: Array.isArray(productData.Images) ? productData.Images.map((img: any) => ({
                    ImageID: img?.ImageID || "",
                    ImageData: img?.ImageData || "",
                })) : [],
                brandID: selectedBrand ? selectedBrand.brandID : productData.brandID,
                brandName: selectedBrand ? selectedBrand.brandName : productData.brandName,
                categoryID: selectedCategory ? selectedCategory.categoryID : productData.categoryID,
                categoryName: selectedCategory ? selectedCategory.categoryName : productData.categoryName,
            };

            setProductCache(prevCache => ({ ...prevCache, [productID]: processedData }));
            setSelectedProduct(processedData);
        } catch (err: any) {
            setError(`Error fetching product details: ${err.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (selectedProduct && brands.length > 0) {
            const selectedBrand = brands.find(brand => brand.brandName === selectedProduct.brandName);

            setEditableProduct(prevProduct => ({
                ...prevProduct,
                brandID: selectedBrand ? selectedBrand.brandID : selectedProduct.brandID,
                brandName: selectedBrand ? selectedBrand.brandName : selectedProduct.brandName,
            }));
        }
    }, [selectedProduct, brands]);

    const fetchBrands = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/GetActiveBrands`);
            if (!response.ok) throw new Error(`Failed to fetch brands. Status: ${response.status}`);

            const brandData = await response.json();

            // Avoid unnecessary state updates
            setBrands(prevBrands => (JSON.stringify(prevBrands) !== JSON.stringify(brandData) ? brandData : prevBrands));
        } catch (err: any) {
            setError(`Error fetching brands: ${err.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch brands only when adding a new product
    useEffect(() => {
        fetchBrands();
    }, []);
 // Initialize as an empty array
    // Using useEffect to update editableProduct with correct category
    useEffect(() => {
        if (selectedProduct && productCategories.length > 0) {
            const selectedCategory = productCategories.find(category => category.categoryName === selectedProduct.categoryName);

            setEditableProduct(prevProduct => ({
                ...prevProduct,
                categoryID: selectedCategory ? selectedCategory.categoryID : selectedProduct.categoryID,
                categoryName: selectedCategory ? selectedCategory.categoryName : selectedProduct.categoryName,
            }));
        }
    }, [selectedProduct, productCategories]);



    useEffect(() => {
        fetchCategories();
    }, []);


    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/GetActiveCategories`);
            if (!response.ok) throw new Error(`Failed to fetch categories. Status: ${response.status}`);

            const categoryData = await response.json();

            setCategory(prevCategories => (JSON.stringify(prevCategories) !== JSON.stringify(categoryData) ? categoryData : prevCategories));
        } catch (err: any) {
            setError(`Error fetching categories: ${err.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch brands only when adding a new product
    

  const handleBrandClick = (brandID: string, categoryID: string) => {
    setSelectedBrand({ brandID, categoryID });
    fetchProductsByBrandAndCategory(brandID, categoryID);
  };

  const handleProductClick = (productID: string) => {
      fetchProductDetails(productID);
      
  };

    const closeOverlay = async (event: React.MouseEvent) => {
        if ((event.target as HTMLElement).classList.contains("overlay")) {
            setSelectedProduct(null); // Close the overlay
           

            // Refresh the products of the selected brand after closing the overlay
            if (selectedBrand) {
                try {
                    await handleBrandClick(selectedBrand.brandID, selectedBrand.categoryID);
                } catch (error) {
                    console.error("Error fetching products:", error);
                }
            }
        }
    };




  useEffect(() => {
      setEditableProduct(selectedProduct);
  }, [selectedProduct]);

    const handleInputChange = (field: keyof ProductDetails, value: any) => {
        setEditableProduct((prev) => {
            if (!prev) return null;

            const parsedValue =
                value === "" ? "" : ["height", "width", "depth", "pricePerMsq", "price", "sqmPerBox", "qtyPerBox", "quantity"].includes(field)
                    ? Number(value)
                    : value;

            return { ...prev, [field]: parsedValue };
        });
    };


    const handleToggle = (field: keyof ProductDetails) => {
        setEditableProduct((prev) => (prev ? { ...prev, [field]: !prev[field] } : null));
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            console.error("No file selected.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result?.toString().split(",")[1];
            if (!base64String) {
                console.error("Failed to convert image to Base64.");
                return;
            }

            const imageData = `data:image/png;base64,${base64String}`;

            if (editableProduct?.productID) {
                
                try {
                    const payload = {
                        ProductID: editableProduct.productID,
                        Base64Image: base64String,
                    };

                    const response = await fetch(`${config.API_URL}/api/StockManager/AddImages`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error("Error uploading image:", errorData);
                        alert("Failed to upload image: " + (errorData.message || "Unknown error"));
                    } else {
                        console.log("Image uploaded successfully!");

                        
                        setEditableProduct((prevProduct) => ({
                            ...prevProduct,
                            images: [...(prevProduct?.images || []), imageData],
                        }));
                    }
                } catch (error) {
                    console.error("Error in image upload:", error);
                    alert("An error occurred while uploading the image.");
                }
            } else {
               
                setNewProductImages((prevImages) => [...prevImages, imageData]);
                console.log("New product image stored locally and UI updated.");
            }
        };

        reader.readAsDataURL(file);
    };



    const handleDeleteImage = (img: any, isNewProduct: boolean) => {
        if (isNewProduct) {
            // For new product image (base64 string)
            setNewProductImages((prevImages) =>
                prevImages.filter((image) => image !== img)  // Remove the base64 string
            );
        } else {
            // For existing product image (image object with imageID)
            if (img.imageID) {
                fetch(`${config.API_URL}/api/StockManager/DeleteImage/${img.imageID}`, {
                    method: "DELETE",
                })
                    .then((response) => {
                        if (!response.ok) {
                            return response.json().then((errorData) => {
                                throw new Error(errorData.message);
                            });
                        }
                        // Optionally update state after deleting the image
                        setEditableProduct((prevProduct) => ({
                            ...prevProduct,
                            images: prevProduct?.images?.filter((image) => image.imageID !== img.imageID),
                        }));
                    })
                    .catch((error) => {
                        console.error("Error deleting image:", error);
                        alert("An error occurred while deleting the image.");
                    });
            } else {
                console.error("No imageID found for existing product image.");
            }
        }
    };










    const [mainImage, setMainImage] = useState<string | null>(null);

    useEffect(() => {
        // Reset the main image when a new product is selected
        if (selectedProduct?.images?.length > 0) {
            setMainImage(selectedProduct.images[0].imageData);  // Set the first image as the main image
        } else {
            setMainImage(null);  // Reset if no images available
        }
    }, [selectedProduct]);  // Trigger whenever the selectedProduct changes


    const handleThumbnailClick = (imageData: string) => {
        setMainImage(imageData);
    };


   





    const handleBrandChange = (e) => {
        const selectedBrandID = e.target.value;
        const selectedBrand = brands.find(brand => brand.brandID === selectedBrandID);

        setEditableProduct(prev => ({
            ...prev,
            brandID: selectedBrandID,
            brandName: selectedBrand ? selectedBrand.brandName : "", // Update name when brand is selected
        }));
    };

    const handleCategoryChange = (e) => {
        const selectedCategoryID = e.target.value;
        const selectedCategory = categories.find(category => category.categoryID === selectedCategoryID);

        setEditableProduct(prev => ({
            ...prev,
            categoryID: selectedCategoryID,
            categoryName: selectedCategory ? selectedCategory.categoryName : "", // Update name when brand is selected
        }));
    };




    const handleSave = async () => {
        setLoading(true);

        // Determine the correct images to send
        let imageData;
        if (editableProduct?.productID) {
            // Existing product: Only send newly uploaded images
            imageData = newProductImages.length > 0 ? newProductImages : undefined;
        } else {
            // New product: Preserve images until saved
            imageData = newProductImages;
        }

        const requestBody = {
            data: {
                productID: editableProduct?.productID || null,
                productName: editableProduct?.productName || "",
                categoryID: editableProduct?.categoryID || null,
                brandID: editableProduct?.brandID || null,
                description: editableProduct?.description || "",
                height: editableProduct?.height ?? null,
                width: editableProduct?.width ?? null,
                depth: editableProduct?.depth ?? null,
                pricePerMsq: editableProduct?.pricePerMsq ?? null,
                price: editableProduct?.price ?? null,
                sqmPerBox: editableProduct?.sqmPerBox ?? null,
                qtyPerBox: editableProduct?.qtyPerBox ?? null,
                quantity: editableProduct?.quantity ?? null,
                available: editableProduct?.available ?? false,
                imageData: editableProduct?.productID
                    ? editableProduct?.images?.map(img => img.imageData) // For existing product, use existing images
                    : newProductImages || [], // Use only necessary images
            }
        };

        try {
            const response = await fetch(`${config.API_URL}/api/StockManager/AddorUpdateProduct`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error("Failed to save product.");

            console.log("Product saved successfully!");

            // Clear images only for new products after saving
            if (!editableProduct?.productID) {
                setNewProductImages([]);
            }

        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product.");
        } finally {
            setLoading(false);
        }
    };




 
  
  return (
      <div className="products-container">
          <Categories categories={categories} selectedBrand={selectedBrand} onBrandClick={handleBrandClick} />
          <div className="add-product-button-container">
              <button onClick={() => setSelectedProduct({})} className="add-product-button">
                  Add New Product
              </button>
          </div>


          <div className="products-grid">
              {/* Button to Add a New Product */}
             

              {error && <p className="error">{error}</p>}
              {!selectedBrand && <p>Select a brand to view products.</p>}
              {products && products.length === 0 && <p>No products available for this brand and category.</p>}
              {products?.map((product) => (
                  <div key={product.productID} className="product-card" onClick={() => handleProductClick(product.productID)}>
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

          {selectedProduct && (
              <div className="overlay" onClick={closeOverlay}>
                  <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
                      <button className="close-button" onClick={() => setSelectedProduct(null)}>
                          X
                      </button>

                      <div className="overlay-left">
                          <div className="overlay-images">
                              {/* Main Image */}
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
                                                  onClick={() => handleThumbnailClick(imgBase64)}  // Handle thumbnail click for new product
                                                  className="thumbnail"
                                              />
                                              <button
                                                  className="delete-button"
                                                  onClick={() => handleDeleteImage(imgBase64, true)} // Pass true for new product
                                              >
                                                  ✖
                                              </button>
                                          </div>
                                      ))
                                  }

                                  {editableProduct?.images?.length > 0 &&
                                      editableProduct.images.map((img, index) => (
                                          <div key={index} className="thumbnail-wrapper">
                                              <img
                                                  src={img.imageData ? `data:image/png;base64,${img.imageData}` : "/placeholder.png"}
                                                  alt={`Existing product image ${index}`}
                                                  onClick={() => handleThumbnailClick(img.imageData)}  // Handle thumbnail click for existing product
                                                  className="thumbnail"
                                              />
                                              <button
                                                  className="delete-button"
                                                  onClick={() => handleDeleteImage(img, false)} // Pass false for existing product
                                              >
                                                  ✖
                                              </button>
                                          </div>
                                      ))}
                              


                                  {/* Upload Box */}
                                  <label className="upload-box">
                                      <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(event) => handleImageUpload(event)}
                                      />
                                      <span>+</span>
                                  </label>
                              </div>
                          </div>
                      </div>        


                     


                      <div className="overlay-right">
                          {/* Editable Product Name with Full Width */}
                          <label><strong>Name::</strong></label> 
                          <input
                              type="text"
                              id="product-name"
                              value={editableProduct?.productName || ""}
                              onChange={(e) =>
                                  setEditableProduct((prev) => ({ ...prev, productName: e.target.value }))
                              }
                              className="full-width-input"
                          />
                          
                          {/* Info Grid with 2 Columns */}
                          <div className="info-grid">
                              {/* Category and Brand Side by Side */}
                              <div className="grid-item">
                                  <label><strong>Category:</strong></label>
                                  <select value={categories.find(category => category.categoryName.trim() === editableProduct?.categoryName?.trim())?.categoryID || ''} onChange={handleCategoryChange} className="full-width-input">
                                      <option value="" disabled>Select a Category</option>
                                      {categories.map((category) => (
                                          <option key={category.categoryID} value={category.categoryID}>
                                              {category.categoryName}
                                          </option>
                                      ))}
                                  </select>
                              </div>
                              <div className="grid-item">
                                  <label><strong>Brand:</strong></label>
                                  <select value={brands.find(brand => brand.brandName.trim() === editableProduct?.brandName?.trim())?.brandID || ''} onChange={handleBrandChange} className="full-width-input">
                                      <option value="" disabled>Select a Brand</option>
                                      {brands.map((brand) => (
                                          <option key={brand.brandID} value={brand.brandID}>
                                              {brand.brandName}
                                          </option>
                                      ))}
                                  </select>

                              </div>


                              {/* Description with Full Width */}
                              <div className="grid-item full-width">
                                  <label><strong>Description:</strong></label>
                                  <textarea
                                      value={editableProduct?.description || ""}
                                      onChange={(e) => handleInputChange("description", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>
                               <div className="grid-item">
                                  <label><strong>Height:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.height || ""}
                                      onChange={(e) => handleInputChange("height", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>

                              <div className="grid-item">
                                  <label><strong>Width:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.width || ""}
                                      onChange={(e) => handleInputChange("width", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>

                              <div className="grid-item">
                                  <label><strong>Depth:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.depth || ""}
                                      onChange={(e) => handleInputChange("depth", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>
                              {/* Price per m² and Sqm per box Side by Side */}
                              <div className="grid-item">
                                  <label><strong>Price per m²:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.pricePerMsq || ""}
                                      onChange={(e) => handleInputChange("pricePerMsq", e.target.value)}
                                      className="full-width-input"
                                  />
                                  </div>

                                  <div className="grid-item">
                                  <label><strong>Price:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.price || ""}
                                      onChange={(e) => handleInputChange("price", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>
                              <div className="grid-item">
                                  <label><strong>Sqm per box:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.sqmPerBox || ""}
                                      onChange={(e) => handleInputChange("sqmPerBox", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>

                              {/* Quantity per box and Quantity Side by Side */}
                              <div className="grid-item">
                                  <label><strong>Qty per box:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.qtyPerBox || ""}
                                      onChange={(e) => handleInputChange("qtyPerBox", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>
                              <div className="grid-item">
                                  <label><strong>Quantity:</strong></label>
                                  <input
                                      type="text"
                                      value={editableProduct?.quantity || ""}
                                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                                      className="full-width-input"
                                  />
                              </div>

                             

                              {/* Available Toggle Switch with Full Width */}
                              <div className="grid-item toggle-container">
                                  <label className="toggle-label"><strong>Available:</strong></label>
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

                          {/* Save Button at Bottom with Full Width */}
                          <div className="save-button-container">
                              <button className="save-button" onClick={handleSave}>
                                  {selectedProduct?.productID ? "Save Changes" : "Add Product"}
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
