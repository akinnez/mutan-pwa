import api from './client'

export type ShareTypeParam = 'mutan' | 'cbt'

export const sharesApi = {
  getMySummary: () => api.get('/shares/me'),
  getMyShares: (type: ShareTypeParam) => api.get(`/shares/me/${type}`),
  getMyTransactions: (type: ShareTypeParam) => api.get(`/shares/me/${type}/transactions`),
}
