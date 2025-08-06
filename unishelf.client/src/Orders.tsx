import React, { useEffect, useState } from 'react';
import './css/Orders.css';
import config from './config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';

// Interfaces matching OrdersService DTOs
interface OrderResponseDto {
    orderID: string; // Encrypted
    nOrderID: number;
    userID: string | null; // Encrypted
    userName: string | 'Guest';
    orderDate: string;
    subtotal: number;
    deliveryCharge: number;
    grandTotal: number;
    status: string;
    createdDate: string;
    updatedDate: string | null;
    updatedByUserName: string | null; // Username of the updater
    orderItems: OrderItemResponseDto[];
    deliveryAddresses: DeliveryAddressesResponseDto;
}

interface OrderItemResponseDto {
    orderItemID: number;
    productID: string; // Encrypted
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface DeliveryAddressesResponseDto {
    deliveryAddressID: number;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    stateProvince: string | null;
    phoneNumber: string;
}

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<OrderResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('Pending');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token is missing.');
            }

            const response = await fetch(`${config.API_URL}/api/Orders/GetAllOrders`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = 'Failed to fetch orders.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    if (response.status === 403) {
                        errorMessage = 'You do not have permission to view orders.';
                    } else if (response.status === 500) {
                        errorMessage = 'Server error occurred while fetching orders.';
                    }
                }
                throw new Error(errorMessage);
            }

            const data: OrderResponseDto[] = await response.json();
            setOrders(data);
        } catch (err: any) {
            console.error('Error fetching orders:', err);
            setError(`Unable to load orders: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderID: string, newStatus: string) => {
        setUpdatingOrderId(orderID);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token is missing.');
            }

            const decodedToken = config.getDecodedToken();
            const encryptedUserId = decodedToken['UserID'] as string;
            if (!encryptedUserId) {
                throw new Error('User ID not found in token.');
            }

            const response = await fetch(`${config.API_URL}/api/Orders/UpdateStatus`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderID: orderID,
                    status: newStatus,
                    updatedBy: encryptedUserId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update order status.');
            }

            await fetchOrders();
        } catch (err: any) {
            console.error('Error updating order status:', err);
            setError(`Error updating order status: ${err.message}`);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const toggleExpandOrder = (orderID: string) => {
        setExpandedOrder(expandedOrder === orderID ? null : orderID);
    };

    // Define status hierarchy
    const statusHierarchy = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    // Get the next valid statuses based on current status
    const getValidStatuses = (currentStatus: string) => {
        const currentIndex = statusHierarchy.indexOf(currentStatus);
        if (currentIndex === -1) return ['Cancelled']; // Default to only allowing cancellation if status is invalid
        // Return statuses from current status onward, including Cancelled
        return statusHierarchy.slice(currentIndex);
    };

    // Group orders by status categories directly
    const pendingOrders = orders.filter(order => order.status === 'Pending');
    const processingOrders = orders.filter(order => order.status === 'Processing');
    const shippedOrders = orders.filter(order => order.status === 'Shipped');
    const deliveredOrders = orders.filter(order => order.status === 'Delivered');
    const cancelledOrders = orders.filter(order => order.status === 'Cancelled');

    const tabs = [
        { name: 'Pending', orders: pendingOrders, title: 'Pending Orders' },
        { name: 'Processing', orders: processingOrders, title: 'Processing Orders' },
        { name: 'Shipped', orders: shippedOrders, title: 'Shipped Orders' },
        { name: 'Delivered', orders: deliveredOrders, title: 'Delivered Orders' },
        { name: 'Cancelled', orders: cancelledOrders, title: 'Cancelled Orders' },
    ];

    const renderOrdersTable = (orders: OrderResponseDto[], sectionTitle: string) => {
        if (orders.length === 0) {
            return <p className="orders-empty">No orders found in this category.</p>;
        }

        return (
            <div className="orders-section">
                <h3 className="section-title">{sectionTitle}</h3>
                {error && <div className="orders-error">{error}</div>}
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>User Name</th>
                            <th>Order Date</th>
                            <th>Grand Total</th>
                            <th>Status</th>
                            <th>Last Updated By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <React.Fragment key={order.orderID}>
                                <tr>
                                    <td>{order.nOrderID}</td>
                                    <td>{order.userName}</td>
                                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td>${order.grandTotal.toFixed(2)}</td>
                                    <td>{order.status}</td>
                                    <td>{order.updatedByUserName || 'N/A'}</td>
                                    <td>
                                        {updatingOrderId === order.orderID ? (
                                            <span>Updating...</span>
                                        ) : (
                                            <>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.orderID, e.target.value)}
                                                    className="status-select"
                                                    disabled={updatingOrderId !== null || ['Delivered', 'Cancelled'].includes(order.status)}
                                                >
                                                    {getValidStatuses(order.status).map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => toggleExpandOrder(order.orderID)}
                                                    className="expand-button"
                                                    disabled={updatingOrderId !== null}
                                                >
                                                    {expandedOrder === order.orderID ? 'Collapse' : 'Expand'}
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedOrder === order.orderID && (
                                    <tr className="expanded-row">
                                        <td colSpan={7}>
                                            <div className="expanded-content">
                                                <h4>Order Items</h4>
                                                <table className="order-items-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Product Name</th>
                                                            <th>Quantity</th>
                                                            <th>Unit Price</th>
                                                            <th>Total Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {order.orderItems.map(item => (
                                                            <tr key={item.orderItemID}>
                                                                <td>{item.productName}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>${item.unitPrice.toFixed(2)}</td>
                                                                <td>${item.totalPrice.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <h4>Delivery Address</h4>
                                                <div className="delivery-address">
                                                    <table className="address-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Street</th>
                                                                <th>City</th>
                                                                <th>State/Province</th>
                                                                <th>Postal Code</th>
                                                                <th>Country</th>
                                                                <th>Phone</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>{order.deliveryAddresses.street}</td>
                                                                <td>{order.deliveryAddresses.city}</td>
                                                                <td>{order.deliveryAddresses.stateProvince || '-'}</td>
                                                                <td>{order.deliveryAddresses.postalCode}</td>
                                                                <td>{order.deliveryAddresses.country}</td>
                                                                <td>{order.deliveryAddresses.phoneNumber}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) return <div className="orders-loading">Loading orders...</div>;
    if (error && orders.length === 0) return <div className="orders-error">{error}</div>;

    return (
        <div className="orders-admin">
            <div className="orders-container">
                <div className="title-container">
                    <FontAwesomeIcon icon={faList} className="title-icon" />
                    <h2 className="orders-title">Order Management</h2>
                </div>
                {orders.length === 0 ? (
                    <p className="orders-empty">No orders found.</p>
                ) : (
                    <>
                        <div className="tabs-container">
                            {tabs.map(tab => (
                                <button
                                    key={tab.name}
                                    className={`tab-button ${activeTab === tab.name ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.name)}
                                >
                                    {tab.title} <span className="tab-counter">({tab.orders.length})</span>
                                </button>
                            ))}
                        </div>
                        {tabs.map(tab => activeTab === tab.name && renderOrdersTable(tab.orders, tab.title))}
                    </>
                )}
            </div>
        </div>
    );
};

export default Orders;