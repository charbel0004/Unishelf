// src/config.js
const API_URL = 'https://localhost:7261';  // Update with your backend URL

const decodeJWT = (token) => {
    try {
        const [header, payload, signature] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return decodedPayload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

const getDecodedToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token not found');
        return null;
    }
    const decoded = decodeJWT(token);
    return decoded;
};

// Exporting an object as default
const config = {
    API_URL,
    getDecodedToken,
};

export default config;