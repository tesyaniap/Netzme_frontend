export interface Ticket {
  id: number
  transaction_id: number
  passenger_id: number
  schedule_id: number
  seat_id: number
  price: number
  status: 'available' | 'booked' | 'paid' | 'issued' | 'cancelled'
  created_at: string
  updated_at: string
  transaction?: {
    id: number
    trx_code: string
    status: string
  }
  passenger?: {
    id: number
    name: string
    email: string
  }
  schedule?: {
    id: number
    departure_time: string
    arrival_time: string
    travel_date: string
    vehicle: {
      id: number
      name: string
      plate_number: string
    }
    route: {
      id: number
      origin_city: {
        name: string
        province: string
      }
      destination_city: {
        name: string
        province: string
      }
      departure_terminal: {
        name: string
        address: string
      }
      arrival_terminal: {
        name: string
        address: string
      }
    }
  }
  seat?: {
    id: number
    seat_number: string
    row: number
    column: number
  }
}

export interface RescheduleTicketRequest {
  new_schedule_id: number
  new_seat_id: number
}