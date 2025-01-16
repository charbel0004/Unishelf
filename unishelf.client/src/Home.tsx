import React from 'react';
import './css/Home.css'; // Import the CSS file for styles

const Home: React.FC = () => {
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
