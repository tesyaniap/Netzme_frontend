export interface City {
  id: number
  name: string
  province: string
  created_at: string
  updated_at: string
}

export interface CreateCityRequest {
  name: string
  province: string
}

export interface UpdateCityRequest {
  name: string
  province: string
}