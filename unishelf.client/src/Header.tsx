import React, { useEffect, useState } from 'react';
import { AiOutlineShoppingCart, AiOutlineUser, AiOutlineMenu } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import './css/Header.css';
import config from './config';

// Define CartProduct interface to match the structure used elsewhere
interface CartProduct {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
}

// Define sessionCart for consistency with Cart.tsx and AllProducts.tsx
const sessionCart = {
    get: (): CartProduct[] => {
        const cart = sessionStorage.getItem('cart');
        const items = cart ? JSON.parse(cart) : [];
        const normalizedItems = items.map((item: CartProduct) => ({
            ...item,
            id: item.id.toLowerCase(),
        }));
        const mergedItems = normalizedItems.reduce((acc: CartProduct[], item: CartProduct) => {
            const existingItem = acc.find((i) => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                return acc;
            }
            return [...acc, item];
        }, []);
        return mergedItems;
    },
};

const Header: React.FC = () => {
    const [showProfile, setShowProfile] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [cartItemCount, setCartItemCount] = useState<number>(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [isCustomer, setIsCustomer] = useState<boolean>(false);
    const [isEmployee, setIsEmployee] = useState<boolean>(false);
    const [isManager, setIsManager] = useState<boolean>(false);
    const navigate = useNavigate();

    // Fetch user info, roles, and set up initial cart count
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = config.getDecodedToken();
                const name = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] as string | undefined;
                const uid = decodedToken['UserID'] as string | undefined;
                const customerRole = decodedToken['Role_Customer'] as string | undefined;
                const employeeRole = decodedToken['Role_Employee'] as string | undefined;
                const managerRole = decodedToken['Role_Manager'] as string | undefined;

                setUserName(name || null);
                setUserId(uid || null);
                setIsCustomer(customerRole === 'True');
                setIsEmployee(employeeRole === 'True');
                setIsManager(managerRole === 'True');
            } catch (error) {
                console.error('Error decoding token in Header:', error);
                setUserName(null);
                setUserId(null);
                setIsCustomer(false);
                setIsEmployee(false);
                setIsManager(false);
            }
        } else {
            setUserName(null);
            setUserId(null);
            setIsCustomer(false);
            setIsEmployee(false);
            setIsManager(false);
        }
    }, []);

    // Function to fetch and update cart item count
    const updateCartCount = async () => {
        try {
            if (userId) {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Authentication token is missing.');
                }
                const response = await fetch(
                    `${config.API_URL}/api/Cart/user/${encodeURIComponent(userId)}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch cart items.');
                }
                const items = await response.json();
                const cartItemsArray = Array.isArray(items) ? items : items.$values || [];
                const uniqueItems = new Set(cartItemsArray.map((item: any) => item.id));
                setCartItemCount(uniqueItems.size);
            } else {
                const items = sessionCart.get();
                const uniqueItems = new Set(items.map((item: CartProduct) => item.id));
                setCartItemCount(uniqueItems.size);
            }
        } catch (err) {
            console.error('Error fetching cart count:', err);
            setCartItemCount(0);
        }
    };

    // Initial fetch of cart count and set up event listener
    useEffect(() => {
        updateCartCount();
        const handleCartUpdated = () => {
            updateCartCount();
        };
        window.addEventListener('cartUpdated', handleCartUpdated);
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdated);
        };
    }, [userId]);

    const toggleProfile = () => setShowProfile((prev) => !prev);
    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setCartItemCount(0); // Reset cart count on logout
        setUserName(null);
        setUserId(null);
        setIsCustomer(false);
        setIsEmployee(false);
        setIsManager(false);
        navigate('/LogIn');
    };

    useEffect(() => {
        const handlePopState = () => {
            navigate('/');
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    // Determine if the user is an employee or manager
    const isEmployeeOrManager = userName && (isEmployee || isManager);

    return (
        <header className="header">
            <div className="header-logo">
                <h1>UNISHELF</h1>
            </div>
            <div className="header-nav">
                <button className="header-mobile-menu-btn" onClick={toggleMobileMenu}>
                    <AiOutlineMenu size={24} />
                </button>
                <nav>
                    <ul className={`header-nav-links ${isMobileMenuOpen ? 'header-active' : ''}`}>
                        {/* Always show Home link */}
                        <li><a href="/">Home</a></li>

                        {/* Show Dashboard only for Employee or Manager */}
                        {isEmployeeOrManager && (
                            <li><a href="/Dashboard">Dashboard</a></li>
                        )}

                        {/* Show My Orders for logged-in customers */}
                        {userName && isCustomer && (
                            <li><a href="/MyOrders">My Orders</a></li>
                        )}

                        {/* Always show Cart link */}
                        <li className="header-cart">
                            <a href="/cart" aria-label={`Cart with ${cartItemCount} items`}>
                                <AiOutlineShoppingCart size={24} />
                                {cartItemCount > 0 && (
                                    <span className="header-cart-count">{cartItemCount}</span>
                                )}
                            </a>
                        </li>

                       

                        {/* Show profile dropdown for all logged-in users, Sign in/Up for non-logged-in users */}
                        {userName ? (
                            <li className="header-profile">
                                <AiOutlineUser
                                    size={24}
                                    onClick={toggleProfile}
                                    className={showProfile ? 'header-user-icon-active' : ''}
                                    aria-label="User profile"
                                />
                                {showProfile && (
                                    <div className="header-profile-dropdown">
                                        <p><strong>Username:</strong> {userName}</p>
                                        <button onClick={handleLogout}>Logout</button>
                                    </div>
                                )}
                            </li>
                        ) : (
                            <li><a href="/LogIn">Sign in/Up</a></li>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;