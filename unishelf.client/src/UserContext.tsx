import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    username: string | null;
    token: string | null;
}

const UserContext = createContext<{ user: User; setUser: React.Dispatch<React.SetStateAction<User>> } | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>({ username: null, token: null });

    useEffect(() => {
        const storedUser = localStorage.getItem('loggedInUser');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser({ username: storedUser, token: storedToken });
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};