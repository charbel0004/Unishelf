import React from 'react';
import './css/Dashboard.css'; // Import the CSS file for styling
import { FaBoxes, FaTags, FaChartBar, FaWarehouse } from 'react-icons/fa';
import { ImUsers } from "react-icons/im";
import { FaBasketShopping } from 'react-icons/fa6';
import { TbCategoryPlus } from "react-icons/tb";
import { FaCartFlatbed } from "react-icons/fa6";
const Dashboard: React.FC = () => {
    const items = [
        { id: 1, label: 'Inventory', icon: <FaBoxes /> },
        { id: 2, label: 'Products', icon: <FaWarehouse />, href: '/products' },
        { id: 3, label: 'Brands and Categories', icon: <TbCategoryPlus />, href: '/BrandsandCategories' },
        { id: 4, label: 'Reports', icon: <FaChartBar /> },
        { id: 5, label: 'Users Management', icon: <ImUsers />, href:'/UserManagement' },
        { id: 6, label: 'Orders', icon: <FaCartFlatbed /> },
    ];

    return (
        // Use a div wrapper with an ID instead of <body>
        <div id="stock-manager-page">
            <div className="stock-manager">
                <div className="squares-container">
                    {items.map((item) => (
                        <div key={item.id} className="square">
                            {/* Wrap the entire square content inside an anchor tag */}
                            {item.href ? (
                                <a href={item.href} className="square-link">
                                    <div className="icon">{item.icon}</div>
                                    <div className="label">{item.label}</div>
                                </a>
                            ) : (
                                <>
                                    <div className="icon">{item.icon}</div>
                                    <div className="label">{item.label}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
