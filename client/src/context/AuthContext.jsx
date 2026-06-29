import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

const ROTATION_INTERVAL = 10 * 60 * 1000; // 10 minutes

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

        // Global Axios Interceptor to catch 401 errors globally
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    setUser(null);
                    toast.error("Session expired. Please log in again.");
                    // Ensure the user is kicked back to the auth page
                    if (window.location.pathname !== '/auth') {
                        window.location.href = '/auth';
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    // Global Identity Rotation Logic
    useEffect(() => {
        if (!user || user.role === 'Authority') return; // Don't rotate for authorities or logged out users

        const rotateIdentity = async () => {
            try {
                await axios.post('http://localhost:5000/api/v1/user/rotate-anonymous-id', {}, {
                    withCredentials: true
                });
                await fetchUser(); // Refresh user info to get new ID
                toast.success("Identity rotated successfully for security.", { icon: '🔄', id: 'rotation-toast' });
                
                // Reset timer
                localStorage.setItem('nextRotationTime', (Date.now() + ROTATION_INTERVAL).toString());
            } catch (error) {
                console.error("Failed to rotate identity", error);
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

        checkRotation(); // Check immediately on mount/user change
        const interval = setInterval(checkRotation, 10000); // Check every 10 seconds to ensure it triggers near the exact time

        return () => clearInterval(interval);
    }, [user?._id, user?.role]); // Re-run when user changes

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
