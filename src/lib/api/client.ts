import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// No manual Authorization header, no js-cookie. The backend sets
// access_token/refresh_token as httpOnly cookies on login, so the browser
// (including when this PWA is installed to a home screen — it's still the
// same browser engine underneath) attaches them automatically. The token
// never passes through page JS, which is what protects it from XSS.
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        return api(original)
      } catch {
        window.location.href = '/onboarding'
      }
    }
    return Promise.reject(error)
  },
)

export default api
