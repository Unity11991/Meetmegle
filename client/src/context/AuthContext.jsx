import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/api/user/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                } catch (err) {
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        setUser({
            _id: res.data.userId,
            username: res.data.username,
            avatarUrl: res.data.avatarUrl
        });
    };

    const signup = async (username, email, password) => {
        const res = await axios.post(`${API_URL}/api/auth/signup`, { username, email, password });
        localStorage.setItem('token', res.data.token);
        setUser({
            _id: res.data.userId,
            username: res.data.username,
            avatarUrl: res.data.avatarUrl
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateAvatar = (newAvatarUrl) => {
        setUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, updateAvatar }}>
            {children}
        </AuthContext.Provider>
    );
};
