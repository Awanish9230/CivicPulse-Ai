import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Pre-configured axios instance with base URL and credentials
const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true,
});

export { API_URL, SOCKET_URL, api };
export default api;
