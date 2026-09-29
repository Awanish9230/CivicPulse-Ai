import { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import api from '../config/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

const ROTATION_INTERVAL = 10 * 60 * 1000; 

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/user/me');
            setUser(data.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();

        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    const requestUrl = error.config?.url || '';
                    if (requestUrl.includes('/login')) {
                        return Promise.reject(error);
                    }
                    
                    setUser(null);
                    toast.error("Session expired. Please log in again.");
                    
                    if (window.location.pathname.startsWith('/authority')) {
                        if (window.location.pathname !== '/authority') {
                            window.location.href = '/authority';
                        }
                    } else if (window.location.pathname !== '/auth') {
                        window.location.href = '/auth';
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    useEffect(() => {
        if (!user || user.role === 'Authority') return; 

        const rotateIdentity = async () => {
            try {
                await api.post('/user/rotate-anonymous-id');
                await fetchUser(); 
                toast.success("Identity auto-rotated successfully for security.", { icon: '🔄', id: 'rotation-toast' });
                
                localStorage.setItem('nextRotationTime', (Date.now() + ROTATION_INTERVAL).toString());
            } catch (error) {
                console.error("Failed to auto-rotate identity", error);
            }
        };

        const checkRotation = () => {
            const storedTime = localStorage.getItem('nextRotationTime');
            if (!storedTime) {
                localStorage.setItem('nextRotationTime', (Date.now() + ROTATION_INTERVAL).toString());
                return;
            }

            if (Date.now() >= parseInt(storedTime)) {
                rotateIdentity();
            }
        };

        checkRotation(); 
        const interval = setInterval(checkRotation, 10000); 

        return () => clearInterval(interval);
    }, [user?._id, user?.role]); 

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/user/logout');
            setUser(null);
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Failed to log out");
        }
    };

    const contextValue = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        fetchUser
    }), [user, loading]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
