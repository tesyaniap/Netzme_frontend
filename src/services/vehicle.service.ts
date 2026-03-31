import { api } from './api.service'
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, BulkVehicleRequest } from '@/types/vehicle.types'
import type { ApiResponse } from '@/types/api.types'

class VehicleService {
  async getAll(): Promise<ApiResponse<Vehicle[]>> {
    const response = await api.get<ApiResponse<Vehicle[]>>('/vehicles')
    return response.data
  }

  async getById(id: number): Promise<ApiResponse<Vehicle>> {
    const response = await api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`)
    return response.data
  }

  async create(data: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    const response = await api.post<ApiResponse<Vehicle>>('/vehicles', data)
    return response.data
  }

  async update(id: number, data: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    const response = await api.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/vehicles/${id}`)
    return response.data
  }

  async generateBulkForm(data: BulkVehicleRequest): Promise<ApiResponse<any>> {
    const response = await api.post<ApiResponse<any>>('/vehicles/bulk/generate', data)
    return response.data
  }

  async bulkStore(data: any): Promise<ApiResponse<Vehicle[]>> {
    const response = await api.post<ApiResponse<Vehicle[]>>('/vehicles/bulk', data)
    return response.data
  }
}

export const vehicleService = new VehicleService()