const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default {
  API_URL,
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
}
