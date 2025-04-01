// Define environment-specific API URLs
const PROD_API_URL = 'http://54.83.149.86:8080/api';
const LOCAL_API_URL = 'http://192.168.6.67:8080/api';

// Set the API URL based on environment
// For local development, comment/uncomment the appropriate line
// export const API_URL = LOCAL_API_URL; // Use this for local development
export const API_URL = PROD_API_URL; // Use this for production 