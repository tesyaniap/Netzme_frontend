import { defineStore } from 'pinia'
import transactionService from '@/services/mitra/transaction.service'

export const useTransactionStore = defineStore('transactionMitra', {
  state: () => ({
    schedules: [] as any[],
    availableSchedules: [] as any[],
    availableLoading: false,
    seatMap: [] as any[],
    seatMapData: null as any,
    transactionDetail: null as any,
    lastBooking: null as any,
    loading: false,
    statistics: {
      today: { count: 0, amount: 0 },
      month: { count: 0, amount: 0 },
      year: { count: 0, amount: 0 }
    },
    history: [] as any[],
    historyPagination: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    },
    ticketData: null as any,
  }),

  actions: {

    // 📋 FETCH ALL AVAILABLE SCHEDULES
    async fetchAvailableSchedules() {
      this.availableLoading = true
      try {
        const res = await transactionService.availableSchedules()
        console.log('🔍 Available schedules API response:', res.data)
        // Backend returns: { status: true, message: { schedules: [...] } }
        this.availableSchedules = res.data.message?.schedules || []
        console.log('📅 Available schedules loaded:', this.availableSchedules.length)
      } catch (error) {
        console.error('❌ Failed to fetch available schedules:', error)
        this.availableSchedules = []
      } finally {
        this.availableLoading = false
      }
    },

    // 🔎 SEARCH
    async search(payload: any) {
      try {
        this.loading = true
        const res = await transactionService.search(payload)
        const data = res.data.data || res.data.message || {}
        this.schedules = data.schedules || []
      } finally {
        this.loading = false
      }
    },

    // 🪑 SEAT MAP
    async getSeatMap(schedule_id: number, travel_date: string) {
      const res = await transactionService.seatMap(schedule_id, travel_date)
      const data = res.data.data || res.data.message || {}
      this.seatMap = data.seats || []
      this.seatMapData = data
      return data
    },

    // 📦 BOOK
    async book(payload: any) {
      const res = await transactionService.book(payload)
      const data = res.data.data || res.data.message
      this.lastBooking = data
      return data
    },

    // 💳 PAY
    async pay(trx_code: string) {
      const res = await transactionService.pay(trx_code)
      return res.data.data || res.data.message
    },

    // 🎟 ISSUE
    async issue(trx_code: string) {
      const res = await transactionService.issue(trx_code)
      return res.data.data || res.data.message
    },

    // ❌ CANCEL
    async cancel(trx_code: string, reason?: string) {
      const res = await transactionService.cancel(trx_code, reason)
      return res.data.data || res.data.message
    },

    // 📄 DETAIL
    async detail(trx_code: string) {
      const res = await transactionService.detail(trx_code)
      this.transactionDetail = res.data.data || res.data.message
      return this.transactionDetail
    },

    // 📊 STATISTICS
    // Response: { success: true, message: { count, amount } }
    async fetchStatistics(period: 'today' | 'month' | 'year', month?: number, year?: number) {
      this.loading = true
      try {
        const res = await transactionService.statistics(period, month, year)
        this.statistics[period] = res.data.message
      } finally {
        this.loading = false
      }
    },

    // 📜 HISTORY
    // Response: { success: true, data: { data: [...], current_page, last_page, per_page, total } }
    async fetchHistory(page: number = 1, per_page: number = 10) {
      this.loading = true
      try {
        const res = await transactionService.history(page, per_page)
        const paginated = res.data.data
        this.history = paginated.data
        this.historyPagination = {
          current_page: paginated.current_page,
          last_page: paginated.last_page,
          per_page: paginated.per_page,
          total: paginated.total
        }
      } finally {
        this.loading = false
      }
    },

    // 🖨️ PRINT TICKET
    // Response: { success: true, message: { trx_code, origin, destination, ... } }
    async fetchTicketData(trx_code: string) {
      this.loading = true
      try {
        const res = await transactionService.printTicket(trx_code)
        this.ticketData = res.data.message
        return this.ticketData
      } finally {
        this.loading = false
      }
    }

  }
})
