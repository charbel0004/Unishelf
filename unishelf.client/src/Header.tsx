import React from 'react';
import { AiOutlineShoppingCart } from 'react-icons/ai'; // Import the cart icon
import './css/Header.css';

interface HeaderProps {
    loggedInUser: string | null;
    onLogout: () => void; // A function to handle logout
}

const Header: React.FC<HeaderProps> = ({ loggedInUser, onLogout }) => {
    return (
        <header className="header">
            <div className="logo">
                <h1>UNISHELF</h1>
            </div>
            <div className="nav">
                <nav>
                    <ul className="nav-links">
                        <li><a href="/">Home</a></li>
                        <li><a href="/profile">Profile</a></li>
                        <li><a href="/cart"><AiOutlineShoppingCart size={24} /></a></li>
                        {loggedInUser ? (
                            <li>
                                <span>Welcome, {loggedInUser}!</span>
                                <button onClick={onLogout}>Logout</button>
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
