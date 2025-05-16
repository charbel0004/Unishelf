import React, { useState, useEffect, useCallback } from 'react';
import './css/BrandsandCategories.css';
import config from './config';

interface Brand {
    brandID: string;
    brandName: string;
    brandEnabled: boolean;
    brandImageID: string;
    brandImage: string | null;
    isActive: boolean;
}

interface Category {
    categoryID: string;
    categoryName: string;
    categoryEnabled: boolean; // Corrected property name
    isActive: boolean;
}

const BrandsandCategories: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [overlayVisible, setOverlayVisible] = useState<boolean>(false);
    const [categoryOverlayVisible, setCategoryOverlayVisible] = useState<boolean>(false);
    const [newBrand, setNewBrand] = useState({
        name: "",
        image: null,
        isActive: true,
        brandId: null,
        brandImageId: null
    });
    const [newCategory, setNewCategory] = useState({
        name: "",
        categoryId: null,
        isActive: true
    });

    const openOverlay = (brand: Brand | null = null) => {
        if (brand) {
            setNewBrand({
                name: brand.brandName,
                image: brand.brandImage ? `data:image/png;base64,${brand.brandImage}` : null,
                isActive: brand.brandEnabled,
                brandImageId: brand.brandImageID,
                brandId: brand.brandID
            });
        } else {
            setNewBrand({
                name: "",
                image: null,
                isActive: true,
                brandId: null,
                brandImageId: null
            });
        }
        setOverlayVisible(true);
    };


    const openCategoryOverlay = (category: any | null = null) => { // Type any due to encryptedCategoryID.
        
        if (category) {
            setNewCategory({
                name: category.categoryName,
                categoryId: category.encryptedCategoryId, // Corrected to use encryptedCategoryId
                isActive: category.categoryEnabled,
            });
        } else {
            setNewCategory({
                name: "",
                categoryId: null,
                isActive: true,
            });
        }
        setCategoryOverlayVisible(true);
    };


    const closeOverlay = () => {
        setNewBrand({ name: "", image: null, isActive: true, brandId: null, brandImageId: null });
        setOverlayVisible(false);
    };

    const closeCategoryOverlay = () => {
        setNewCategory({ name: "", categoryId: null, isActive: true });
        setCategoryOverlayVisible(false);
    };

    const handleBrandInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewBrand({ ...newBrand, name: e.target.value });
    };

    const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewCategory({ ...newCategory, name: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewBrand({ ...newBrand, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBrandToggleChange = () => {
        setNewBrand({ ...newBrand, isActive: !newBrand.isActive });
    };

    const handleCategoryToggleChange = () => {
        setNewCategory({ ...newCategory, isActive: !newCategory.isActive });
    };

    const handleBrandSubmit = async () => {
        try {
            const brandData = {
                brandId: newBrand.brandId,
                brandName: newBrand.name,
                isActive: newBrand.isActive,
                brandImageId: newBrand.brandImageId,
                base64Image: newBrand.image ? newBrand.image.split(',')[1] : null
            };

            const url = `${config.API_URL}/api/Dashboard/AddOrUpdateBrand`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brandData)
            });

            if (!response.ok) throw new Error('Failed to save brand');

            fetchData(`${config.API_URL}/api/Dashboard/GetBrands`, setBrands, 'Failed to load brands.');

            closeOverlay();
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleCategorySubmit = async () => {
        try {
            const categoryData = {
                categoryId: newCategory.categoryId, // Ensure this is set correctly
                categoryName: newCategory.name,
                isActive: newCategory.isActive,
            };

            const url = `${config.API_URL}/api/Dashboard/AddOrUpdateCategory`;
            const response = await fetch(url, {
                method: 'POST', // Confirm if API requires 'PUT' for updates
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData),
            });

            if (!response.ok) throw new Error('Failed to save category');

            // Refresh categories list
            fetchData(`${config.API_URL}/api/Dashboard/GetCategories`, setCategories, 'Failed to load categories.', true);

            closeCategoryOverlay();
        } catch (error: any) {
            setError(error.message);
        }
    };


    const handleBrandToggle = async (brand: Brand) => {
        try {
            const url = `${config.API_URL}/api/Dashboard/AddOrUpdateBrand`;
            const updatedBrand = {
                ...brand,
                brandEnabled: !brand.brandEnabled,
                isActive: !brand.brandEnabled,
                brandId: brand.brandID,
                brandName: brand.brandName,
                brandImageId: brand.brandImageID,
                base64Image: brand.brandImage ? brand.brandImage : null
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBrand)
            });

            if (!response.ok) throw new Error('Failed to update brand status');

            // Update the brands state directly
            setBrands((prevBrands) =>
                prevBrands.map((b) =>
                    b.brandID === brand.brandID ? { ...b, isActive: !brand.brandEnabled, brandEnabled: !brand.brandEnabled } : b
                )
            );
        } catch (error: any) {
            setError(error.message);
        }
    };


    const handleCategoryToggle = async (category: Category) => {
        try {
            const url = `${config.API_URL}/api/Dashboard/update-category-status`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    CategoryId: category.encryptedCategoryId,
                    IsEnabled: !category.categoryEnabled,
                }),
            });

            if (!response.ok) throw new Error('Failed to update category status');

            fetchData(`${config.API_URL}/api/Dashboard/GetCategories`, setCategories, 'Failed to load categories.', true);
        } catch (error: any) {
            setError(error.message);
        }
    };



    const fetchData = useCallback(async (url: string, setter: React.Dispatch<React.SetStateAction<any[]>>, errorMsg: string, isCategory = false) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(errorMsg);
            const data = await response.json();

            const mappedData = data.map((item: any) => {
                let isActive;
                if (isCategory) {
                    isActive = item.categoryEnabled;
                } else {
                    isActive = item.brandEnabled !== undefined ? item.brandEnabled : item.isEnabled;
                }
                return {
                    ...item,
                    categoryId: item.encryptedCategoryId, // Add this line
                    isActive: isActive,
                };
            });
            setter(mappedData);
        } catch (err: any) {
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(`${config.API_URL}/api/Dashboard/GetBrands`, setBrands, 'Failed to load brands.');
        fetchData(`${config.API_URL}/api/Dashboard/GetCategories`, setCategories, 'Failed to load categories.');
    }, [fetchData]);

    if (loading) return <p>Loading brands and categories...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="container">
            {/* Brands Section */}
            <div className="brands">
                <h2>Brands <span className="count">({brands.length})</span>
                    <button className="add-brand" onClick={() => openOverlay()}>+ Add Brand</button>
                </h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Image</th><th>Name</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand.brandID}>
                                    <td onClick={() => openOverlay(brand)}>
                                        <img src={brand.brandImage ? `data:image/png;base64,${brand.brandImage}` : "/placeholder.png"}
                                            alt={brand.brandName}
                                            className="brand-icon" />
                                    </td>
                                    <td onClick={() => openOverlay(brand)}>{brand.brandName}</td>
                                    <td>
                                        <label className="switch">
                                            <input type="checkbox" checked={brand.isActive} onChange={() => handleBrandToggle(brand)} />
                                            <span className="slider"></span>{brand.isActive ? 'Active' : 'Inactive'}
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>

            {/* Categories Section */}
            <div className="categories">
                <h2>Categories <span className="count">({categories.length})</span>
                    <button className="add-brandandcategory" onClick={() => openCategoryOverlay()}>+ Add Category</button>
                </h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.categoryID}>
                                    <td onClick={() => openCategoryOverlay(category)} >{category.categoryName}</td>
                                    <td>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={category.categoryEnabled}
                                                onChange={() => handleCategoryToggle(category)} 
                                            />
                                            <span className="slider"></span>{category.categoryEnabled ? 'Active' : 'Inactive'} 
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Brand Overlay */}
            {overlayVisible && (
                <div className="brands-overlay">
                    <div className="brands-overlay-content">
                        <h3 className="brands-overlay-title">{newBrand.brandId ? 'Edit' : 'Add New'} Brand</h3>
                        <label className="overlay-brand-name">Brand Name</label>
                        <input className="add-brand-name" type="text" placeholder="Brand Name" value={newBrand.name} onChange={handleBrandInputChange} />
                        <label className="overlay-brand-image">Brand Image</label>
                        <div className="upload-switch-container">
                            <label className="brands-upload-box">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <span>+</span>
                            </label>
                            {newBrand.image && <img src={newBrand.image} alt="Brand Preview" className="brand-preview" />}
                        </div>
                        <label className="overlay-brand-image">is Brand Active?</label>
                        <label className="switch">
                            <input type="checkbox" checked={newBrand.isActive} onChange={handleBrandToggleChange} />
                            <span className="slider"></span>
                        </label>
                        <div className="brands-button-container">
                            <button onClick={handleBrandSubmit}>{newBrand.brandId ? 'Update' : 'Add'} Brand</button>
                            <button onClick={closeOverlay}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Overlay */}
            {categoryOverlayVisible && (
                <div className="brands-overlay">
                    <div className="brands-overlay-content">
                        <h3 className="brands-overlay-title">{newCategory.categoryId ? 'Edit' : 'Add New'} Category</h3>
                        <label className="overlay-brand-name">Category Name</label>
                        <input type="text" className="add-brand-name"  placeholder="Category Name" value={newCategory.name} onChange={handleCategoryInputChange} />
                        <label className="overlay-brand-image">is Category Active?</label>
                        <label className="switch">
                            <input type="checkbox" checked={newCategory.isActive} onChange={handleCategoryToggleChange} />
                            <span className="slider"></span>
                        </label>
                        <div className="brands-button-container">
                            <button onClick={handleCategorySubmit}>{newCategory.categoryId ? 'Update' : 'Add'} Category</button>
                            <button onClick={closeCategoryOverlay}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>  
    );
};

export default BrandsandCategories;
