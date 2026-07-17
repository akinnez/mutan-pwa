import api from './client'
export const investmentsApi = {
  getAvailable: () => api.get('/investments'),
  getMyInvestments: () => api.get('/investments/me'),
}
