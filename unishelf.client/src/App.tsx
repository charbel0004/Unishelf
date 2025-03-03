import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./Header"; // Navigation bar component
import Home from "./Home";
import Cart from "./Cart";
import LogIn from "./LogIn";
import Dashboard from './Dashboard';
import Products from './Products';
import BrandsandCategories from './BrandsandCategories';

const App: React.FC = () => {
    const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("loggedInUser");
        if (storedUser) {
            setLoggedInUser(storedUser); // Restore logged-in user from localStorage
        }
    }, []);

    const location = useLocation();

    // Check if the current path matches "/LogIn"
    const shouldShowHeader = location.pathname !== "/LogIn";

    return (
        <div className="App">
            {shouldShowHeader && (
                <Header loggedInUser={loggedInUser} onLogout={() => {
                    setLoggedInUser(null); // Clear the loggedInUser state
                    localStorage.removeItem("loggedInUser"); // Remove user from localStorage
                }} />
            )}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/LogIn" element={<LogIn setLoggedInUser={setLoggedInUser} />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Products" element={<Products />} />
                <Route path="/BrandsandCategories" element={<BrandsandCategories />} />
            </Routes>
        </div>
    );
};

const AppWrapper: React.FC = () => {
    return (
        <Router>
            <App />
        </Router>
    );
};

export default AppWrapper;
