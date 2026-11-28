import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (userData: User, accessToken?: string) => void;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    login: () => {},
    logout: async () => {},
    fetchUser: async () => {},
});
