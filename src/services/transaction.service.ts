import { api } from './api.service'
import { scheduleService } from './schedule.service'
import type { ApiResponse } from '@/types/api.types'

interface BookingRequest {
  schedule_id: number
  passenger_count: number
  selected_seats?: string[]
  customer_name: string
  customer_phone: string
  customer_email?: string
}

interface BookingValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface Transaction {
  id: number
  trx_code: string
  schedule_id: number
  customer_name: string
  customer_phone: string
  customer_email?: string
  passenger_count: number
  selected_seats: string[]
  total_price: number
  status: string
  created_at: string
}

class TransactionService {
  async validateBooking(request: BookingRequest): Promise<BookingValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!request.customer_name?.trim()) {
      errors.push('Nama customer wajib diisi')
    }

    if (!request.customer_phone?.trim()) {
      errors.push('Nomor telepon wajib diisi')
    }

    if (request.passenger_count < 1) {
      errors.push('Jumlah penumpang minimal 1')
    }

    if (request.passenger_count > 10) {
      errors.push('Jumlah penumpang maksimal 10')
    }

    // Seat validation if seats are selected
    if (request.selected_seats && request.selected_seats.length > 0) {
      if (request.selected_seats.length !== request.passenger_count) {
        errors.push(`Jumlah kursi (${request.selected_seats.length}) harus sama dengan jumlah penumpang (${request.passenger_count})`)
      }

      // Check for duplicate seats
      const uniqueSeats = [...new Set(request.selected_seats)]
      if (uniqueSeats.length !== request.selected_seats.length) {
        errors.push('Tidak boleh memilih kursi yang sama')
      }

      // Validate seat availability
      try {
        const validation = await scheduleService.validateSeatSelection(
          request.schedule_id, 
          request.selected_seats
        )

        if (!validation.data.valid) {
          errors.push(`Kursi tidak tersedia: ${validation.data.conflicts.join(', ')}`)
        }
      } catch (error) {
        warnings.push('Tidak dapat memvalidasi ketersediaan kursi secara real-time')
      }
    } else if (request.passenger_count > 1) {
      warnings.push('Kursi akan dipilih otomatis oleh sistem')
    }

    // Phone number format validation
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/
    if (request.customer_phone && !phoneRegex.test(request.customer_phone.replace(/\s|-/g, ''))) {
      errors.push('Format nomor telepon tidak valid')
    }

    // Email validation if provided
    if (request.customer_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(request.customer_email)) {
        errors.push('Format email tidak valid')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  async book(request: BookingRequest): Promise<ApiResponse<Transaction>> {
    // Validate before booking
    const validation = await this.validateBooking(request)
    
    if (!validation.valid) {
      throw new Error(`Validasi gagal: ${validation.errors.join(', ')}`)
    }

    try {
      const response = await api.post<ApiResponse<Transaction>>('/transactions/book', {
        schedule_id: request.schedule_id,
        passenger_count: request.passenger_count,
        selected_seats: request.selected_seats || [],
        customer_name: request.customer_name,
        customer_phone: request.customer_phone,
        customer_email: request.customer_email
      })
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info('Transaction booking API error:', error.message)
      }
      throw error
    }
  }

  async getByCode(trxCode: string): Promise<ApiResponse<Transaction>> {
    try {
      const response = await api.get<ApiResponse<Transaction>>(`/transactions/${trxCode}`)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Transaction detail API error for code: ${trxCode}`)
      }
      throw error
    }
  }

  async pay(trxCode: string, paymentData: any): Promise<ApiResponse<Transaction>> {
    try {
      const response = await api.post<ApiResponse<Transaction>>(`/transactions/pay`, {
        trx_code: trxCode,
        ...paymentData
      })
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Payment API error for transaction: ${trxCode}`)
      }
      throw error
    }
  }

  async cancel(trxCode: string, reason?: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(`/transactions/${trxCode}/cancel`, {
        reason
      })
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Cancel transaction API error for code: ${trxCode}`)
      }
      throw error
    }
  }

  async getSeatMap(scheduleId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>('/transactions/seat-map', {
        schedule_id: scheduleId
      })
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Seat map API error for schedule: ${scheduleId}`)
      }
      
      // Fallback to schedule service
      try {
        const availability = await scheduleService.getSeatAvailability(scheduleId)
        return {
          success: true,
          message: 'Seat map from schedule service',
          data: {
            seats: availability.data.available_seats.map(seat => ({
              seat_number: seat,
              status: 'available'
            })).concat(
              availability.data.booked_seats.map(seat => ({
                seat_number: seat,
                status: 'booked'
              }))
            ).concat(
              availability.data.blocked_seats.map(seat => ({
                seat_number: seat,
                status: 'blocked'
              }))
            )
          }
        }
      } catch {
        throw error
      }
    }
  }
}

export const transactionService = new TransactionService()
export type { BookingRequest, BookingValidation, Transaction }