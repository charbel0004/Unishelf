import React from 'react';
import './css/StockManager.css'; // Import the CSS file for styling
import { FaBoxes, FaChartBar, FaTruck, FaWarehouse } from 'react-icons/fa';

const StockManager = () => {
    const items = [
        { id: 1, label: 'Inventory', icon: <FaBoxes /> },
        { id: 2, label: 'Reports', icon: <FaChartBar /> },
        { id: 3, label: 'Suppliers', icon: <FaTruck /> },
        { id: 4, label: 'Warehouse', icon: <FaWarehouse /> },
    ];

    return (
        <div className="stock-manager">
            <h1 className="title">Stock Manager</h1>
            <div className="squares-container">
                {items.map((item) => (
                    <div key={item.id} className="square">
                        <div className="icon">{item.icon}</div>
                        <div className="label">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StockManager;
