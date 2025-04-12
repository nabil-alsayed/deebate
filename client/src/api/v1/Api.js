import axios from 'axios'
// You can import and use a centralized API config if needed
// import * as config from '@/api/v1/apiConfig'

// Create a pre-configured Axios instance for making API requests
export const Api = axios.create({
  // Set the base URL for all API calls
  // It first checks for the VITE_API_ENDPOINT environment variable
  // If not defined, it falls back to localhost on port 3001
  baseURL: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001/api/v1'
})