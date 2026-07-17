import api from './client'
export const loansApi = {
  getMyLoans: () => api.get('/loans/me'),
  getActiveLoan: () => api.get('/loans/me/active'),
}
