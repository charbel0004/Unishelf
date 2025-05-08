import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import config from "./config";
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
    const navigate = useNavigate();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState<string>("");

    useEffect(() => {
        const fetchBrands = async () => {
            if (categoryID) {
                try {
                    const response = await fetch(`${config.API_URL}/api/StockManager/brandsByCategory/${categoryID}`);
                    const data: ApiResponse = await response.json();
                    setBrands(data.brands || []);
                    setCategoryName(data.categoryName || "");
                    console.log("API Response in AllBrands:", data);
                } catch (err) {
                    setError("Error fetching brands.");
                    console.error("Error fetching brands:", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchBrands();
    }, [categoryID]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="all-brands-page">
            <div className="all-brands-container">
                <h1 className="allbrands-h1">All Brands for <span style={{ color: "#007acc" }}>{categoryName}</span></h1>
                <div className="allbrand-list">
                    {brands.length > 0 ? (
                        brands.map((brand) => (
                            <div
                                key={brand.brandID}
                                className="allbrand-card"
                                onClick={() =>
                                    navigate(`/AllProducts/${brand.brandID}/${categoryID}`
                                    )
                                }
                                style={{ cursor: 'pointer' }}
                            >
                                {brand.brandImageBase64 && (
                                    <img
                                        src={`data:image/jpeg;base64,${brand.brandImageBase64}`}
                                        alt={brand.brandName}
                                        className="allbrand-image"
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
        </div>
    );
};

export default AllBrands;
