import React, { FC, useState, useEffect } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import './css/LogIn.css';
import config from './config';
import { useNavigate } from 'react-router-dom';

interface CartProduct {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface LoginProps {
    setLoggedInUser: React.Dispatch<React.SetStateAction<string | null>>;
}

const sessionCart = {
    get: (): CartProduct[] => {
        const cart = sessionStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    },
    clear: () => {
        sessionStorage.removeItem('cart');
    },
};

const Login: FC<LoginProps> = ({ setLoggedInUser }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [usernames, setUsernames] = useState<string[]>([]);
    const [isUsernameTaken, setIsUsernameTaken] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    // Fetch usernames from the API
    useEffect(() => {
        const fetchUsernames = async () => {
            try {
                const response = await fetch(`${config.API_URL}/api/Home/UN_GetUsernames`);
                if (response.ok) {
                    const data = await response.json();
                    setUsernames(data);
                } else {
                   console.error('Failed to fetch usernames');
                }
            } catch (error) {
                console.error('Error fetching usernames:', error);
            }
        };

        fetchUsernames();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));

        if (id === 'username') {
            const usernameExists = usernames.includes(value);
            setIsUsernameTaken(usernameExists);
        }

        if (id === 'password') validatePassword(value);
        if (id === 'confirmPassword') validatePasswordMatch(value);
    };

    const validatePassword = (password: string = formData.password) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setPasswordError(
                'Password must be at least 8 characters long, include a capital letter and a special character.'
            );
        } else {
            setPasswordError('');
        }
    };

    const validatePasswordMatch = (confirmPassword: string = formData.confirmPassword) => {
        if (formData.password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match.');
        } else {
            setConfirmPasswordError('');
        }
    };

    const mergeSessionCart = async (token: string, username: string) => {
        const sessionCartItems = sessionCart.get();
        if (sessionCartItems.length === 0) return;

        try {
            for (const item of sessionCartItems) {
                const response = await fetch(`${config.API_URL}/api/Cart/Add-Cart-Items`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: username,
                        encryptedProductId: item.id,
                        quantity: item.quantity,
                    }),
                });
                if (!response.ok) {
                    console.error(`Failed to merge cart item ${item.id}`);
                }
            }
            sessionCart.clear();
        } catch (error) {
            console.error('Error merging session cart:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSignUp) {
            validatePassword();
            validatePasswordMatch();
            if (passwordError || confirmPasswordError || isUsernameTaken) return;
        }

        const dataToSubmit = {
            password: formData.password,
            ...(isSignUp
                ? {
                    username: formData.username,
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber,
                }
                : {
                    usernameOrEmail: formData.username || formData.email,
                }),
        };

        try {
            const url = isSignUp
                ? `${config.API_URL}/api/Home/signup`
                : `${config.API_URL}/api/Home/login`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit),
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('token', result.token);
                setLoggedInUser(formData.username);
                if (isSignUp) {
                    setSuccessMessage('User created successfully!');
                    await mergeSessionCart(result.token, formData.username);
                    window.location.reload();
                } else {
                    await mergeSessionCart(result.token, formData.username);
                    navigate('/');
                }
            } else {
                setErrorMessage(result.message || 'An error occurred during the process.');
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
            console.error('Error:', error);
        }
    };

    const isFormValid = () => {
        if (isSignUp) {
            return (
                formData.firstName &&
                formData.lastName &&
                formData.username &&
                formData.email &&
                formData.password &&
                formData.confirmPassword &&
                phoneNumber &&
                !isUsernameTaken
            );
        } else {
            return (formData.username || formData.email) && formData.password;
        }
    };

    return (
        <div className="wrapper signIn">
            <div className="illustration">
                <img src="Pictures/logo.png" alt="illustration" />
            </div>
            <div className="form">
                <div className="heading">{isSignUp ? 'SIGN UP' : 'LOGIN'}</div>
                <form onSubmit={handleSubmit}>
                    {isSignUp ? (
                        <>
                            <div className="row">
                                <div>
                                    <label htmlFor="firstName">First Name</label>
                                    <input
                                        className="First"
                                        type="text"
                                        id="firstName"
                                        placeholder="Enter your First Name"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName">Last Name</label>
                                    <input
                                        className="First"
                                        type="text"
                                        id="lastName"
                                        placeholder="Enter your Last Name"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Enter your Username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                                {isUsernameTaken && (
                                    <p className="error">This username is already taken.</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="phone">Phone Number</label>
                                <PhoneInput
                                    id="phone"
                                    placeholder="Enter your phone number"
                                    value={phoneNumber}
                                    onChange={setPhoneNumber}
                                    defaultCountry="LB"
                                    international
                                    countryCallingCodeEditable={false}
                                />
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Enter your Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Enter your Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                                {passwordError && <p className="error">{passwordError}</p>}
                            </div>
                            <div>
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    placeholder="Confirm your Password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />
                                {confirmPasswordError && (
                                    <p className="error">{confirmPasswordError}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label htmlFor="username">Username/Email</label>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Enter your Username or Email"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Enter your Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    )}
                    <button type="submit" disabled={!isFormValid()}>
                        {isSignUp ? 'Create Account' : 'Log In'}
                    </button>
                </form>
                <p className="link">
                    {isSignUp ? (
                        <>
                            Already have an account?{' '}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsSignUp(false);
                                }}
                            >
                                Login
                            </a>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsSignUp(true);
                                }}
                            >
                                Sign Up
                            </a>
                        </>
                    )}
                </p>
                {successMessage && <div className="success-message">{successMessage}</div>}
                {errorMessage && <div className="error-message">{errorMessage}</div>}
            </div>
        </div>
    );
};

export default Login;