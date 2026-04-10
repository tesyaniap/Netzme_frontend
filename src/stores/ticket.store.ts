import { defineStore } from 'pinia'
import ticketService from '@/services/ticket.service'

export const useTicketStore = defineStore('ticket', {
  state: () => ({
    tickets: [] as any[],
    ticketDetail: null as any,
    ticketData: null as any,
    printData: null as any,
    
    // Reschedule state
    rescheduleableTickets: [] as any[],
    availableSchedules: [] as any[],
    availableSeats: [] as any[],
    rescheduleFeeData: null as any,
    rescheduleHistory: [] as any[],
    
    // Pagination
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    },
    
    // Loading states
    loading: false,
    loadingDetail: false,
    loadingPrint: false,
    loadingSchedules: false,
    loadingSeats: false,
    loadingFee: false,
    loadingReschedule: false,
  }),

  actions: {
    // 📋 FETCH ALL TICKETS
    async fetchTickets(page: number = 1, filters: any = {}) {
      this.loading = true
      try {
        const res = await ticketService.getTickets(page, filters)
        this.tickets = res.data.data || []
        this.pagination = {
          current_page: res.data.current_page || 1,
          last_page: res.data.last_page || 1,
          per_page: res.data.per_page || 10,
          total: res.data.total || 0
        }
        console.log('✅ Tickets loaded:', this.tickets.length)
        return this.tickets
      } catch (error) {
        console.error('❌ Failed to fetch tickets:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 🔍 GET TICKET DETAIL
    async fetchTicketDetail(ticketId: number) {
      this.loadingDetail = true
      try {
        const res = await ticketService.getTicketDetail(ticketId)
        this.ticketDetail = res.data.data
        console.log('✅ Ticket detail loaded:', this.ticketDetail)
        return this.ticketDetail
      } catch (error) {
        console.error('❌ Failed to fetch ticket detail:', error)
        throw error
      } finally {
        this.loadingDetail = false
      }
    },

    // 🖨️ GET TICKET DATA FOR PRINTING
    async fetchTicketData(ticketId: number) {
      this.loadingPrint = true
      try {
        const res = await ticketService.getTicketData(ticketId)
        this.ticketData = res.data.data
        this.printData = res.data.data
        console.log('✅ Ticket data loaded for printing:', this.ticketData)
        return this.ticketData
      } catch (error) {
        console.error('❌ Failed to fetch ticket data:', error)
        throw error
      } finally {
        this.loadingPrint = false
      }
    },

    // 📅 GET AVAILABLE SCHEDULES FOR RESCHEDULE
    async fetchAvailableSchedules(ticketId: number) {
      this.loadingSchedules = true
      try {
        const res = await ticketService.getAvailableSchedules(ticketId)
        this.availableSchedules = res.data.data || []
        console.log('✅ Available schedules loaded:', this.availableSchedules.length)
        return this.availableSchedules
      } catch (error) {
        console.error('❌ Failed to fetch available schedules:', error)
        throw error
      } finally {
        this.loadingSchedules = false
      }
    },

    // 🪑 GET AVAILABLE SEATS FOR SCHEDULE
    async fetchAvailableSeats(scheduleId: number) {
      this.loadingSeats = true
      try {
        const res = await ticketService.getAvailableSeats(scheduleId)
        this.availableSeats = res.data.data || []
        console.log('✅ Available seats loaded:', this.availableSeats.length)
        return this.availableSeats
      } catch (error) {
        console.error('❌ Failed to fetch available seats:', error)
        throw error
      } finally {
        this.loadingSeats = false
      }
    },

    // 💰 CALCULATE RESCHEDULE FEE
    async calculateRescheduleFee(ticketId: number, newScheduleId: number, newSeatId: number) {
      this.loadingFee = true
      try {
        const res = await ticketService.calculateRescheduleFee({
          ticket_id: ticketId,
          new_schedule_id: newScheduleId,
          new_seat_id: newSeatId
        })
        this.rescheduleFeeData = res.data.data
        console.log('✅ Reschedule fee calculated:', this.rescheduleFeeData)
        return this.rescheduleFeeData
      } catch (error) {
        console.error('❌ Failed to calculate reschedule fee:', error)
        throw error
      } finally {
        this.loadingFee = false
      }
    },

    // 🔄 PROCESS RESCHEDULE
    async processReschedule(ticketId: number, newScheduleId: number, newSeatId: number, reason?: string) {
      this.loadingReschedule = true
      try {
        const res = await ticketService.rescheduleTicket({
          ticket_id: ticketId,
          new_schedule_id: newScheduleId,
          new_seat_id: newSeatId,
          reason: reason || 'Admin reschedule request'
        })
        console.log('✅ Ticket rescheduled successfully:', res.data.data)
        return res.data.data
      } catch (error) {
        console.error('❌ Failed to reschedule ticket:', error)
        throw error
      } finally {
        this.loadingReschedule = false
      }
    },

    // 📜 GET RESCHEDULE HISTORY
    async fetchRescheduleHistory(ticketId: number) {
      try {
        const res = await ticketService.getRescheduleHistory(ticketId)
        this.rescheduleHistory = res.data.data?.reschedule_history || []
        console.log('✅ Reschedule history loaded:', this.rescheduleHistory.length)
        return this.rescheduleHistory
      } catch (error) {
        console.error('❌ Failed to fetch reschedule history:', error)
        throw error
      }
    },

    // 🔍 GET RESCHEDULE-ABLE TICKETS
    async fetchRescheduleableTickets(page: number = 1) {
      try {
        const res = await ticketService.getRescheduleableTickets(page)
        this.rescheduleableTickets = res.data.data || []
        console.log('✅ Reschedule-able tickets loaded:', this.rescheduleableTickets.length)
        return this.rescheduleableTickets
      } catch (error) {
        console.error('❌ Failed to fetch reschedule-able tickets:', error)
        throw error
      }
    },

    // 🧹 RESET RESCHEDULE STATE
    resetRescheduleState() {
      this.availableSchedules = []
      this.availableSeats = []
      this.rescheduleFeeData = null
      this.loadingSchedules = false
      this.loadingSeats = false
      this.loadingFee = false
    }
  }
})
