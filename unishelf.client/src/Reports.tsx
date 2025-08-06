import React, { useEffect, useState } from 'react';
import './css/Reports.css';
import config from './config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Interfaces for API responses
interface MonthlySalesDto {
    month: string;
    totalSales: number;
}

interface StockQuantityDto {
    productID: number;
    productName: string;
    quantity: number;
}

interface CartQuantityDto {
    productID: number;
    productName: string;
    totalQuantity: number;
}

const Reports: React.FC = () => {
    const [monthlySales, setMonthlySales] = useState<MonthlySalesDto[]>([]);
    const [stockQuantities, setStockQuantities] = useState<StockQuantityDto[]>([]);
    const [cartQuantities, setCartQuantities] = useState<CartQuantityDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token is missing.');
            }
            console.log('Token:', token); // Log the full token

            // Fetch Monthly Sales
            console.log('Fetching Monthly Sales...');
            const salesResponse = await fetch(`${config.API_URL}/api/Reports/MonthlySales`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!salesResponse.ok) {
                const errorData = await salesResponse.json();
                console.error('Monthly Sales Response:', salesResponse.status, errorData);
                throw new Error(errorData.error || 'Failed to fetch monthly sales.');
            }
            const salesData = await salesResponse.json();
            setMonthlySales(salesData);

            // Fetch Stock Quantities
            console.log('Fetching Stock Quantities...');
            const stockResponse = await fetch(`${config.API_URL}/api/Reports/StockQuantities`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!stockResponse.ok) {
                const errorData = await stockResponse.json();
                console.error('Stock Quantities Response:', stockResponse.status, errorData);
                throw new Error(errorData.error || 'Failed to fetch stock quantities.');
            }
            const stockData = await stockResponse.json();
            setStockQuantities(stockData);

            // Fetch Cart Quantities
            console.log('Fetching Cart Quantities...');
            const cartResponse = await fetch(`${config.API_URL}/api/Reports/CartQuantities`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!cartResponse.ok) {
                const errorData = await cartResponse.json();
                console.error('Cart Quantities Response:', cartResponse.status, errorData);
                throw new Error(errorData.error || 'Failed to fetch cart quantities.');
            }
            const cartData = await cartResponse.json();
            setCartQuantities(cartData);
        } catch (err: any) {
            console.error('Error fetching report data:', err);
            setError(`Unable to load reports: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token is missing.');
            }

            const response = await fetch(`${config.API_URL}/api/Reports/DownloadExcel`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to download Excel report.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'SalesReport.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error downloading Excel:', err);
            setError(`Error downloading Excel report: ${err.message}`);
        }
    };

    // Chart Data Preparation
    const salesChartData = {
        labels: monthlySales.map(s => s.month),
        datasets: [
            {
                label: 'Total Sales ($)',
                data: monthlySales.map(s => s.totalSales),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    };

    const stockChartData = {
        labels: stockQuantities.map(s => s.productName),
        datasets: [
            {
                label: 'Quantity in Stock',
                data: stockQuantities.map(s => s.quantity),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            },
        ],
    };

    const cartChartData = {
        labels: cartQuantities.map(c => c.productName),
        datasets: [
            {
                label: 'Quantity in Cart',
                data: cartQuantities.map(c => c.totalQuantity),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Allow custom sizing
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                font: {
                    size: 16,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    if (loading) return <div className="reports-loading">Loading reports...</div>;
    if (error) return <div className="reports-error">{error}</div>;

    return (
        <div className="reports-page">
            <div className="reports-admin">
                <div className="reports-container">
                    <div className="title-container">
                        <FontAwesomeIcon icon={faChartLine} className="title-icon" />
                        <h2 className="reports-title">Sales & Inventory Reports</h2>
                    </div>
                    <button onClick={downloadExcel} className="download-button">
                        <FontAwesomeIcon icon={faDownload} /> Download Excel Report
                    </button>
                    <div className="charts-grid">
                        <div className="chart-section">
                            <h3>Monthly Sales (Last 12 Months)</h3>
                            <div className="chart-wrapper">
                                <Line
                                    data={salesChartData}
                                    options={{
                                        ...chartOptions,
                                        plugins: {
                                            ...chartOptions.plugins,
                                            title: { text: 'Monthly Sales Trend' },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                        <div className="chart-section">
                            <h3>Stock Quantities</h3>
                            <div className="chart-wrapper">
                                <Bar
                                    data={stockChartData}
                                    options={{
                                        ...chartOptions,
                                        plugins: {
                                            ...chartOptions.plugins,
                                            title: { text: 'Stock Quantities by Product' },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                        <div className="chart-section">
                            <h3>Products in Cart (Logged-in User)</h3>
                            <div className="chart-wrapper">
                                {cartQuantities.length > 0 ? (
                                    <Bar
                                        data={cartChartData}
                                        options={{
                                            ...chartOptions,
                                            plugins: {
                                                ...chartOptions.plugins,
                                                title: { text: 'Quantities in Cart by Product' },
                                            },
                                        }}
                                    />
                                ) : (
                                    <p>No items in cart.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;