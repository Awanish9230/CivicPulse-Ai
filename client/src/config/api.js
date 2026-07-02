import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://civicpulse-aib.onrender.com';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://civicpulse-aib.onrender.com';

// Pre-configured axios instance with base URL and credentials
const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true,
});

export { API_URL, SOCKET_URL, api };
export default api;
