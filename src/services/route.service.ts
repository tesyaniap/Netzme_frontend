import { api } from './api.service'
import type { Route, CreateRouteRequest, UpdateRouteRequest } from '@/types/route.types'
import type { ApiResponse } from '@/types/api.types'

class RouteService {
  async getAll(): Promise<ApiResponse<Route[]>> {
    const response = await api.get<ApiResponse<Route[]>>('/routes')
    return response.data
  }

  async getById(id: number): Promise<ApiResponse<Route>> {
    try {
      const response = await api.get<ApiResponse<Route>>(`/routes/${id}`)
      return response.data
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.info(`Route detail API not available for ID: ${id}`)
      }
      return {
        success: false,
        message: 'Route detail not available',
        data: null as any
      }
    }
  }

  async create(data: CreateRouteRequest): Promise<ApiResponse<Route>> {
    const response = await api.post<ApiResponse<Route>>('/routes', data)
    return response.data
  }

  async update(id: number, data: UpdateRouteRequest): Promise<ApiResponse<Route>> {
    const response = await api.put<ApiResponse<Route>>(`/routes/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/routes/${id}`)
    return response.data
  }
}

export const routeService = new RouteService()