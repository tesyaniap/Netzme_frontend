export interface Seat {
  id: number
  vehicle_id: number
  seat_number: string
  row: number
  column: number
  created_at: string
  updated_at: string
  vehicle?: {
    id: number
    name: string
    plate_number: string
  }
}

export interface CreateSeatRequest {
  vehicle_id: number
  seat_number: string
  row: number
  column: number
}

export interface GenerateSeatsRequest {
  vehicle_id: number
  seat_capacity: number
  layout: string
}