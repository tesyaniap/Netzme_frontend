import { api } from './api.service'
import type { Ticket, RescheduleTicketRequest } from '@/types/ticket.types'
import type { ApiResponse } from '@/types/api.types'

class TicketService {
  async getById(id: number): Promise<ApiResponse<Ticket>> {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`)
    return response.data
  }

  async getTicketData(id: number): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`/tickets/${id}/data`)
    return response.data
  }

  async reschedule(id: number, data: RescheduleTicketRequest): Promise<ApiResponse<Ticket>> {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/reschedule`, data)
    return response.data
  }
}

export const ticketService = new TicketService()