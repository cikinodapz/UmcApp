import axios, { AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined in the environment variables");
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add interceptor to include JWT token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export async function fetchData(
  endpoint: string, 
  options: { 
    method?: string; 
    data?: any;
    headers?: Record<string, string>;
  } = {}
) {
  console.log("Request URL:", `${API_URL}${endpoint}`);
  console.log("Request Data:", options.data);
  
  try {
    const config: AxiosRequestConfig = {
      url: endpoint,
      method: options.method || 'GET',
    };

    // Handle FormData differently
    if (options.data instanceof FormData) {
      config.data = options.data;
      // Jangan set Content-Type untuk FormData
      config.headers = {
        ...options.headers,
        'Content-Type': undefined, // Biarkan browser set boundary
      };
    } else {
      // Untuk data biasa (JSON)
      config.data = options.data;
      config.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };
    }

    const response = await api.request(config);
    console.log("Response Data:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Axios Error:", error.response?.status, error.response?.data);
      throw new Error(
        `API error: ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
    console.error("Network Error:", error);
    throw new Error('API error: Network or unknown error');
  }
}