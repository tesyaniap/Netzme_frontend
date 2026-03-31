import { api } from './api.service'
import type { City, CreateCityRequest, UpdateCityRequest } from '@/types/city.types'
import type { ApiResponse } from '@/types/api.types'

class CityService {
  async getAll(): Promise<ApiResponse<City[]>> {
    const response = await api.get<ApiResponse<City[]>>('/cities')
    return response.data
  }

  async getById(id: number): Promise<ApiResponse<City>> {
    const response = await api.get<ApiResponse<City>>(`/cities/${id}`)
    return response.data
  }

  async create(data: CreateCityRequest): Promise<ApiResponse<City>> {
    const response = await api.post<ApiResponse<City>>('/cities', data)
    return response.data
  }

  async update(id: number, data: UpdateCityRequest): Promise<ApiResponse<City>> {
    const response = await api.put<ApiResponse<City>>(`/cities/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/cities/${id}`)
    return response.data
  }
}

export const cityService = new CityService()