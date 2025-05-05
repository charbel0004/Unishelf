import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import config from "./config"; // Ensure config has the correct API URL
import "./css/AllBrands.css";

interface Brand {
    brandID: string;
    brandName: string;
    brandImageBase64: string | null;
}

interface ApiResponse {
    categoryName: string;
    brands: Brand[];
}

const AllBrands: React.FC = () => {
    const { categoryID } = useParams();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState<string>(""); // To store the category name

    useEffect(() => {
        const fetchBrands = async () => {
            if (categoryID) {
                try {
                    const response = await fetch(`${config.API_URL}/api/StockManager/brandsByCategory/${categoryID}`);
                    const data: ApiResponse = await response.json();
                    setBrands(data.brands || []); // Access the brands array
                    setCategoryName(data.categoryName || ""); // Access the category name
                    console.log("API Response in AllBrands:", data); // Keep this for debugging
                } catch (err) {
                    setError("Error fetching brands.");
                    console.error("Error fetching brands:", err); // Log the error for debugging
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchBrands();
    }, [categoryID]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="all-brands-container">
            <h1 className="allbrands-h1">All Brands for {categoryName}</h1>
            <div className="brand-list">
                {brands.length > 0 ? (
                    brands.map((brand) => (
                        <div key={brand.brandID} className="brand-card">
                            {brand.brandImageBase64 && (
                                <img
                                    src={`data:image/jpeg;base64,${brand.brandImageBase64}`}
                                    alt={brand.brandName}
                                    className="brand-image"
                                />
                            )}
                            <p>{brand.brandName}</p>
                        </div>
                    ))
                ) : (
                    <p>No brands available for this category.</p>
                )}
            </div>
        </div>
    );
};

export default AllBrands;