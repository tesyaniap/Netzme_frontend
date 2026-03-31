import { api } from '@/services/api.service'

interface SearchPayload {
  origin: string
  destination: string
  travel_date: string
}

interface Passenger {
  name: string
  identity_number: string
}

interface BookPayload {
  schedule_id: number
  travel_date: string
  seats: number[]
  customer_name: string
  customer_phone: string
  customer_email?: string
  passengers: Passenger[]
}

export default {

  // 📋 All available schedules (hari ini dan selanjutnya)
  availableSchedules() {
    const today = new Date().toISOString().split('T')[0]
    return api.get('/transactions/schedules', { params: { date_from: today } })
  },

  // 🔎 Search schedule
  search(payload: SearchPayload) {
    return api.post('/transactions/search', payload)
  },

  // 🪑 Seat Map
  seatMap(schedule_id: number, travel_date: string) {
    return api.post('/transactions/seat-map', { schedule_id, travel_date })
  },

  // 📦 Book transaction (status: pending)
  book(payload: BookPayload) {
    return api.post('/transactions/book', payload)
  },

  // 💳 Pay transaction (potong saldo)
  pay(trx_code: string) {
    return api.post('/transactions/pay', { trx_code })
  },

  // 🎟 Issue ticket (fee masuk balance)
  issue(trx_code: string) {
    return api.post(`/transactions/${trx_code}/issue`)
  },

  // ❌ Cancel transaction (refund jika paid)
  cancel(trx_code: string, reason?: string) {
    return api.post(`/transactions/${trx_code}/cancel`, { reason })
  },

  // 📄 Detail transaction
  detail(trx_code: string) {
    return api.get(`/transactions/${trx_code}`)
  },

  // 📊 Statistics
  statistics(period: 'today' | 'month' | 'year', month?: number, year?: number) {
    return api.get('/transactions/statistics', {
      params: { period, month, year }
    })
  },

  // 📜 History
  history(page: number = 1, per_page: number = 10) {
    return api.get('/transactions/history', {
      params: { page, per_page }
    })
  },

  // 🖨️ Print ticket
  printTicket(trx_code: string) {
    return api.get(`/transactions/${trx_code}/print`)
  }

}
