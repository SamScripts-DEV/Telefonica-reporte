import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})


api.interceptors.request.use(
    response=> response,
    error => {
        console.error('Api request error: ', error);
        return Promise.reject(error)
    }
)

export default api;