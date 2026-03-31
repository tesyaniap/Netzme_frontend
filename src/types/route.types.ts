export interface Route {
  id: number
  origin_city_id: number
  destination_city_id: number
  departure_terminal_id: number
  arrival_terminal_id: number
  distance: number
  created_at: string
  updated_at: string
  origin_city?: {
    id: number
    name: string
    province: string
  }
  destination_city?: {
    id: number
    name: string
    province: string
  }
  departure_terminal?: {
    id: number
    name: string
    address: string
  }
  arrival_terminal?: {
    id: number
    name: string
    address: string
  }
}

export interface CreateRouteRequest {
  origin_city_id: number
  destination_city_id: number
  departure_terminal_id: number
  arrival_terminal_id: number
  distance: number
}

export interface UpdateRouteRequest {
  origin_city_id: number
  destination_city_id: number
  departure_terminal_id: number
  arrival_terminal_id: number
  distance: number
}