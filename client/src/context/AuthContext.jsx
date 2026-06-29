import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/user/me', {
                withCredentials: true
            });
            setUser(data.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await axios.post('http://localhost:5000/api/v1/user/logout', {}, {
                withCredentials: true
            });
            setUser(null);
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Failed to log out");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};
