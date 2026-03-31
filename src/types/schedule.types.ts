export interface Schedule {
  id: number
  vehicle_id: number
  route_id: number
  departure_time: string
  arrival_time: string
  price: number
  travel_date: string
  created_at: string
  updated_at: string
  vehicle?: {
    id: number
    name: string
    plate_number: string
    seat_capacity: number
  }
  route?: {
    id: number
    origin_city: {
      id: number
      name: string
      province: string
    }
    destination_city: {
      id: number
      name: string
      province: string
    }
    departure_terminal: {
      id: number
      name: string
      address: string
    }
    arrival_terminal: {
      id: number
      name: string
      address: string
    }
    distance: number
  }
}

export interface CreateScheduleRequest {
  vehicle_id: number
  route_id: number
  departure_time: string
  arrival_time: string
  price: number
  travel_date: string
}

export interface UpdateScheduleRequest {
  vehicle_id: number
  route_id: number
  departure_time: string
  arrival_time: string
  price: number
  travel_date: string
}