import api from './client'

export const authApi = {
  verifyIdentity: (d: { phone_number: string; id_number: string }) =>
    api.post('/auth/verify-identity', d),
  requestOtp: (phone_number: string, is_first_time: boolean) =>
    api.post('/auth/request-otp', { phone_number, is_first_time }),
  confirmOtp: (d: { phone_number: string; otp: string }) =>
    api.post('/auth/confirm-otp', d),
  setupCredentials: (d: { setup_token: string; password: string; pin: string }) =>
    api.post('/auth/setup-credentials', d),
  login: (d: { phone_number: string; password: string }) =>
    api.post('/auth/login', d),
  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (phone_number: string) =>
    api.post('/auth/forgot-password', { phone_number }),
  resetPassword: (d: { setup_token: string; new_password: string }) =>
    api.post('/auth/reset-password', d),
  requestPinResetOtp: () =>
    api.post('/auth/request-pin-reset-otp'),
  resetPin: (d: { setup_token: string; new_pin: string }) =>
    api.post('/auth/reset-pin', d),
  verifyPin: (pin: string) =>
    api.post('/auth/verify-pin', { pin }),
  changePassword: (d: { current_password: string; new_password: string }) =>
    api.patch('/auth/change-password', d),
}
