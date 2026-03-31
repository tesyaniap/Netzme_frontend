import { api } from './api.service'
import type { Terminal, CreateTerminalRequest, UpdateTerminalRequest } from '@/types/terminal.types'
import type { ApiResponse } from '@/types/api.types'

class TerminalService {
  async getAll(): Promise<ApiResponse<Terminal[]>> {
    const response = await api.get<ApiResponse<Terminal[]>>('/terminals')
    return response.data
  }

  async getById(id: number): Promise<ApiResponse<Terminal>> {
    const response = await api.get<ApiResponse<Terminal>>(`/terminals/${id}`)
    return response.data
  }

  async create(data: CreateTerminalRequest): Promise<ApiResponse<Terminal>> {
    const response = await api.post<ApiResponse<Terminal>>('/terminals', data)
    return response.data
  }

  async update(id: number, data: UpdateTerminalRequest): Promise<ApiResponse<Terminal>> {
    const response = await api.put<ApiResponse<Terminal>>(`/terminals/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/terminals/${id}`)
    return response.data
  }
}

export const terminalService = new TerminalService()