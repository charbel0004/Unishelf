import React, { useEffect } from 'react';
import './css/Home.css'; // Import the CSS file for styles

const Home: React.FC = () => {
    useEffect(() => {
        // Disable back button
        const handleBackButton = () => {
            // Push the same state to prevent back navigation
            window.history.pushState(null, '', window.location.href);
        };

        // Add event listener for popstate
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handleBackButton);

        return () => {
            // Clean up the event listener
            window.removeEventListener('popstate', handleBackButton);
        };
    }, []);

    return (
        <div className="home-container">
            {/* Background content */}
            <div className="content-container">
                <h1 className="headline">Welcome to Unishelf</h1>
            </div>
        </div>
    );
};

export default Home;
