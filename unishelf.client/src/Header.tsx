import React, { useEffect, useState } from 'react';
import { AiOutlineShoppingCart, AiOutlineUser, AiOutlineMenu } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import './css/Header.css';
import config from './config';

const Header: React.FC = () => {
    const [showProfile, setShowProfile] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    let userName = "";

    // Retrieve and decode token
    const token = localStorage.getItem('token');
    if (token) {
        const decodedToken = config.getDecodedToken();
        userName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];
    }

    const toggleProfile = () => setShowProfile((prev) => !prev);
    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

    // Logout functionality
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/LogIn');
    };

    // Disable browser back button on home page
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
                        <li><a href="/">Home</a></li>
                        <li><a href="/Dashboard">Dashboard</a></li>
                        <li><a href="/cart"><AiOutlineShoppingCart size={24} /></a></li>
                        {userName ? (
                            <li className="header-profile">
                                <AiOutlineUser
                                    size={24}
                                    onClick={toggleProfile}
                                    className={showProfile ? 'header-user-icon-active' : ''}
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