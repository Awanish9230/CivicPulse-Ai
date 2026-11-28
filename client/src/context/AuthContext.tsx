import { ReactNode, useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { AuthContext, type AuthContextValue } from './authContextValue';

export { AuthContext, type AuthContextValue };

const ROTATION_INTERVAL = 10 * 60 * 1000;
const TOKEN_STORAGE_KEY = 'civicpulse_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const userRef = useRef<User | null>(null);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const fetchUser = async () => {
        try {
            const { data } = await api.get<{ data: User }>('/user/me');
            userRef.current = data.data;
            setUser(data.data);
        } catch {
            userRef.current = null;
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const attachToken = (config: { headers?: Record<string, unknown> }) => {
            const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
            if (token && config.headers && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        };

        const axiosReqInterceptor = axios.interceptors.request.use((config) => attachToken(config) as typeof config);
        const apiReqInterceptor = api.interceptors.request.use((config) => attachToken(config) as typeof config);

        fetchUser();

        const handleUnauthorized = (error: unknown) => {
            const axiosErr = error as { response?: { status?: number }; config?: { url?: string } };
            if (axiosErr?.response?.status === 401) {
                const requestUrl: string = axiosErr.config?.url || '';
                const ignoredRoutes = [
                    '/login',
                    '/register',
                    '/user/me',
                    '/complaint/all',
                    '/message/',
                    '/user/leaderboard',
                    '/public/'
                ];
                if (ignoredRoutes.some((segment) => requestUrl.includes(segment))) {
                    return Promise.reject(error);
                }

                if (!userRef.current) {
                    return Promise.reject(error);
                }

                sessionStorage.removeItem(TOKEN_STORAGE_KEY);
                userRef.current = null;
                setUser(null);
                toast.error("Session expired. Please log in again.", { id: 'session-expired' });

                const path = window.location.pathname;
                if (path.startsWith('/admin')) {
                    if (path !== '/admin') window.location.href = '/admin';
                } else if (path.startsWith('/authority')) {
                    if (path !== '/authority') window.location.href = '/authority';
                } else if (path !== '/auth' && path !== '/community') {
                    window.location.href = '/auth';
                }
            }
            return Promise.reject(error);
        };

        const axiosInterceptor = axios.interceptors.response.use((r) => r, handleUnauthorized);
        const apiInterceptor = api.interceptors.response.use((r) => r, handleUnauthorized);

        return () => {
            axios.interceptors.request.eject(axiosReqInterceptor);
            api.interceptors.request.eject(apiReqInterceptor);
            axios.interceptors.response.eject(axiosInterceptor);
            api.interceptors.response.eject(apiInterceptor);
        };
    }, []);

    useEffect(() => {
        if (!user || user.role !== 'Citizen') {
            localStorage.removeItem('nextRotationTime');
            return;
        }

        const rotateIdentity = async () => {
            try {
                const { data } = await api.post<{ data?: { accessToken?: string } }>('/user/rotate-anonymous-id');
                if (data?.data?.accessToken) {
                    sessionStorage.setItem(TOKEN_STORAGE_KEY, data.data.accessToken);
                }
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

            if (Date.now() >= parseInt(storedTime, 10)) {
                rotateIdentity();
            }
        };

        checkRotation();
        const interval = setInterval(checkRotation, 10000);

        return () => clearInterval(interval);
    }, [user?._id, user?.role]);

    const login = (userData: User, accessToken?: string) => {
        if (accessToken) {
            sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        }
        userRef.current = userData;
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/user/logout');
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            userRef.current = null;
            setUser(null);
            toast.success("Logged out successfully");
        } catch {
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            userRef.current = null;
            setUser(null);
            toast.error("Failed to log out");
        }
    };

    const contextValue = useMemo<AuthContextValue>(() => ({
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
