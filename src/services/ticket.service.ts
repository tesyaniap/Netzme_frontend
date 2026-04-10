import { api } from './api.service'

const ticketService = {
  // 📋 GET ALL TICKETS
  getTickets(page: number = 1, filters: any = {}) {
    return api.get('/reports/transactions', {
      params: {
        page,
        per_page: 10,
        status: 'issued',
        ...filters
      }
    })
  },

  // 🔍 GET TICKET DETAIL
  getTicketDetail(ticketId: number) {
    return api.get(`/tickets/${ticketId}`)
  },

  // 🖨️ GET TICKET DATA FOR PRINTING
  getTicketData(ticketId: number) {
    return api.get(`/tickets/${ticketId}/data`)
  },

  // 📅 GET AVAILABLE SCHEDULES FOR RESCHEDULE
  getAvailableSchedules(ticketId: number) {
    return api.get('/tickets/reschedule/schedules', {
      params: { ticket_id: ticketId }
    })
  },

  // 🪑 GET AVAILABLE SEATS FOR SCHEDULE
  getAvailableSeats(scheduleId: number) {
    return api.get('/tickets/reschedule/seats', {
      params: { schedule_id: scheduleId }
    })
  },

  // 💰 CALCULATE RESCHEDULE FEE
  calculateRescheduleFee(payload: any) {
    return api.post('/tickets/reschedule/calculate-fee', payload)
  },

  // 🔄 PROCESS RESCHEDULE
  rescheduleTicket(payload: any) {
    return api.post('/tickets/reschedule', payload)
  },

  // 📜 GET RESCHEDULE HISTORY
  getRescheduleHistory(ticketId: number) {
    return api.get(`/tickets/${ticketId}/reschedule-history`)
  },

  // 🔍 GET RESCHEDULE-ABLE TICKETS
  getRescheduleableTickets(page: number = 1) {
    return api.get('/tickets/reschedule/available', {
      params: { page, per_page: 10 }
    })
  }
}

export default ticketService
