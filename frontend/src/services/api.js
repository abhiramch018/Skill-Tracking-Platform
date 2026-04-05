import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || '';

const API = axios.create({
    baseURL: `${BASE}/api`,
});

// Attach auth token to every request EXCEPT public auth endpoints
const PUBLIC_PATHS = [
    '/auth/login/',
    '/auth/register/',
    '/auth/forgot-password/',
    '/auth/reset-password/',
];

API.interceptors.request.use((config) => {
    const isPublic = PUBLIC_PATHS.some((p) => config.url?.includes(p));
    if (!isPublic) {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
    }
    return config;
});

export default API;
