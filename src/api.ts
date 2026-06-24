import axios from 'axios';

// Vite exposes environment variables via import.meta.env
// We default to localhost:5000 if the environment variable is not provided
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Example of how to use apiClient:
// export const fetchUsers = () => apiClient.get('/users');
// export const createPost = (data: any) => apiClient.post('/posts', data);
