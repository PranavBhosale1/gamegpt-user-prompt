export const environment = {
  S3_UPLOAD_URL: import.meta.env.VITE_S3_UPLOAD_URL || "http://localhost:8000/upload",
  NODE_API_URL: import.meta.env.VITE_NODE_API_URL || "http://localhost:8000/api/reaction",
  NODE_API_URL_EMOTION: import.meta.env.VITE_NODE_API_URL_EMOTION || "http://localhost:8000/api/emotions",
  NODE_API_URL_GET_EMOTION: import.meta.env.VITE_NODE_API_URL_GET_EMOTION || "http://localhost:8000/api/getemotions",
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
};