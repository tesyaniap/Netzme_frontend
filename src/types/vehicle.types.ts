export interface Vehicle {
  id: number
  name: string
  plate_number: string
  seat_capacity: number
  seat_layout: string
  partner_id: number
  status: 'active' | 'inactive' | 'maintenance'
  created_at: string
  updated_at: string
  partner?: {
    id: number
    name: string
    email: string
  }
}

export interface CreateVehicleRequest {
  name: string
  plate_number: string
  seat_capacity: number
  seat_layout: string
  partner_id: number
  status: 'active' | 'inactive' | 'maintenance'
}

export interface UpdateVehicleRequest {
  name: string
  plate_number: string
  seat_capacity: number
  seat_layout: string
  partner_id: number
  status: 'active' | 'inactive' | 'maintenance'
}

export interface BulkVehicleRequest {
  partner_id: number
  vehicle_count: number
  seat_capacity: number
  seat_layout: string
  name_prefix: string
  plate_prefix: string
}