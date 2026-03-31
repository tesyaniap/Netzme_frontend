import { api } from './api.service'
import type { ApiResponse } from '@/types/api.types'

interface Seat {
  id: number
  vehicle_id: number
  seat_number: string
  row: number
  column: number
  is_occupied: boolean
  status: string
  created_at?: string
  updated_at?: string
}

class SeatService {
  async getAll(): Promise<ApiResponse<Seat[]>> {
    try {
      const response = await api.get<ApiResponse<Seat[]>>('/seats')
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info('Seat API not available')
      }
      return {
        success: false,
        message: 'Seat service not available',
        data: []
      }
    }
  }

  async getByVehicle(vehicleId: number): Promise<ApiResponse<Seat[]>> {
    try {
      const response = await api.get<ApiResponse<Seat[]>>(`/vehicles/${vehicleId}/seats`)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Vehicle seats API not available for vehicle ${vehicleId}`)
      }
      return {
        success: false,
        message: 'Vehicle seats not available',
        data: []
      }
    }
  }

  async generateSeats(vehicleId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post<ApiResponse<any>>(`/vehicles/${vehicleId}/seats/generate`)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info('Generate seats API not available')
      }
      throw error
    }
  }

  async resetSeats(vehicleId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete<ApiResponse<any>>(`/vehicles/${vehicleId}/seats`)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info('Reset seats API not available')
      }
      throw error
    }
  }

  async updateSeatStatus(seatId: number, status: string): Promise<ApiResponse<Seat>> {
    try {
      const response = await api.put<ApiResponse<Seat>>(`/seats/${seatId}`, { 
        status,
        is_occupied: status === 'occupied'
      })
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info('Update seat status API not available')
      }
      throw error
    }
  }

  async bulkUpdateSeats(vehicleId: number, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.put<ApiResponse<any>>(`/vehicles/${vehicleId}/seats/bulk`, { 
        status,
        is_occupied: status === 'occupied'
      })
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info('Bulk update seats API not available')
      }
      throw error
    }
  }

  async getById(id: number): Promise<ApiResponse<Seat>> {
    try {
      const response = await api.get<ApiResponse<Seat>>(`/seats/${id}`)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Seat detail API not available for ID: ${id}`)
      }
      return {
        success: false,
        message: 'Seat detail not available',
        data: null as any
      }
    }
  }

  async create(data: Partial<Seat>): Promise<ApiResponse<Seat>> {
    try {
      const response = await api.post<ApiResponse<Seat>>('/seats', data)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info('Create seat API not available')
      }
      throw error
    }
  }

  async update(id: number, data: Partial<Seat>): Promise<ApiResponse<Seat>> {
    try {
      const response = await api.put<ApiResponse<Seat>>(`/seats/${id}`, data)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Update seat API not available for ID: ${id}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(`/seats/${id}`)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Delete seat API not available for ID: ${id}`)
      }
      throw error
    }
  }
}

export const seatService = new SeatService()
export type { Seat }