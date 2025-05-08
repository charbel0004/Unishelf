import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import config from "./config";
import './css/Home.css';

interface Brand {
    BrandID: string;
    BrandName: string;
    BrandImageBase64: string | null;
}

interface Category {
    CategoryID: string;
    CategoryName: string;
    Brands: Brand[];
}

const Home: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryID, setSelectedCategoryID] = useState<string>("all");
    const navigate = useNavigate();
    const sliderRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const handleBackButton = () => {
            window.history.pushState(null, '', window.location.href);
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handleBackButton);
        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/StockManager/categoriesBrands`);
                const raw = await res.json();

                if (Array.isArray(raw)) {
                    const parsed: Category[] = raw.map((cat: any) => ({
                        CategoryID: cat.categoryID,
                        CategoryName: cat.categoryName,
                        Brands: Array.isArray(cat.brands)
                            ? cat.brands.map((b: any) => ({
                                BrandID: b.brandID,
                                BrandName: b.brandName,
                                BrandImageBase64: b.brandImageBase64,
                            }))
                            : [],
                    }));
                    setCategories(parsed);
                    sliderRefs.current = Array(parsed.length).fill(null);
                } else {
                    console.error("Unexpected response format:", raw);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const handleSeeAll = (categoryID: string) => {
        navigate(`/AllBrands/${categoryID}`);
    };

    const scrollSlider = (index: number, direction: 'left' | 'right') => {
        const slider = sliderRefs.current[index];
        if (slider) {
            const scrollAmount = direction === 'left' ? -280 : 280;
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="home-container">
            <div className="content-container">
                <h1 className="headline">Welcome to Unishelf</h1>

                {/* Filter Dropdown */}
                <div className="filter-bar">
                    <label htmlFor="categoryFilter">Filter by Category:</label>
                    <select
                        id="categoryFilter"
                        value={selectedCategoryID}
                        onChange={(e) => setSelectedCategoryID(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.CategoryID} value={cat.CategoryID}>
                                {cat.CategoryName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtered Category Sections */}
                {categories
                    .filter(cat => selectedCategoryID === "all" || cat.CategoryID === selectedCategoryID)
                    .map((category, index) => (
                        <div key={category.CategoryID} className="category-section">
                            <div className="category-header">
                                <h2>{category.CategoryName}</h2>
                                <button
                                    className="see-all-button"
                                    onClick={() => handleSeeAll(category.CategoryID)}
                                >
                                    See all
                                </button>
                            </div>

                            <div className="slider-container">
                                {category.Brands.length > 5 && (
                                    <button
                                        className="slider-arrow slider-arrow-left"
                                        onClick={() => scrollSlider(index, 'left')}
                                        aria-label="Scroll left"
                                    >
                                        &lt;
                                    </button>
                                )}

                                <div
                                    className="brand-slider"
                                    ref={el => sliderRefs.current[index] = el}
                                >
                                    {category.Brands.map((brand) => (
                                        <div
                                            key={brand.BrandID}
                                            className="brand-card"
                                            onClick={() =>
                                                navigate(
                                                    `/AllProducts/${brand.BrandID}/${category.CategoryID}`,
                                                    {
                                                        state: {
                                                            brandName: brand.BrandName,
                                                            categoryName: category.CategoryName
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            <div className="brand-image-container">
                                                {brand.BrandImageBase64 ? (
                                                    <img
                                                        src={`data:image/jpeg;base64,${brand.BrandImageBase64}`}
                                                        alt={brand.BrandName}
                                                        className="home-brand-image"
                                                    />
                                                ) : (
                                                    <div className="brand-image-placeholder">
                                                        {brand.BrandName.substring(0, 1)}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="brand-name">{brand.BrandName}</p>
                                        </div>
                                    ))}
                                </div>

                                {category.Brands.length > 5 && (
                                    <button
                                        className="slider-arrow slider-arrow-right"
                                        onClick={() => scrollSlider(index, 'right')}
                                        aria-label="Scroll right"
                                    >
                                        &gt;
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Home;
