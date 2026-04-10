<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Manajemen Jadwal</h1>
            <p class="text-muted-foreground mt-1">Kelola jadwal keberangkatan bus</p>
          </div>
          <Button @click="openScheduleDialog">
            <Plus class="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        </div>

        <!-- Filters -->
        <Card>
          <CardContent class="pt-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="space-y-2">
                <Label>Tanggal</Label>
                <Input v-model="filters.date" type="date" />
              </div>
              <div class="space-y-2">
                <Label>Rute</Label>
                <select v-model="filters.route_id" class="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">Semua Rute</option>
                  <option v-for="route in routes" :key="route.id" :value="route.id">
                    {{ route.origin_terminal?.city?.name }} - {{ route.destination_terminal?.city?.name }}
                  </option>
                </select>
              </div>
              <div class="space-y-2">
                <Label>Kendaraan</Label>
                <select v-model="filters.vehicle_id" class="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">Semua Kendaraan</option>
                  <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                    {{ vehicle.license_plate }} - {{ vehicle.brand }}
                  </option>
                </select>
              </div>
              <div class="flex items-end">
                <Button @click="fetchSchedules" class="w-full">
                  <Search class="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Schedules Table -->
        <Card>
          <CardHeader>
            <CardTitle>Daftar Jadwal</CardTitle>
            <CardDescription>{{ schedules.length }} jadwal ditemukan</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loadingSchedules" class="text-center py-8">Loading...</div>
            <div v-else-if="schedules.length === 0" class="text-center py-8 text-muted-foreground">
              Belum ada jadwal
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Rute</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Kursi</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="schedule in schedules" :key="schedule.id">
                  <TableCell>{{ formatDate(schedule.travel_date) }}</TableCell>
                  <TableCell>
                    <div class="font-medium">
                      {{ schedule.route?.origin_terminal?.city?.name }} - {{ schedule.route?.destination_terminal?.city?.name }}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {{ schedule.route?.origin_terminal?.name }} → {{ schedule.route?.destination_terminal?.name }}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="font-medium">{{ schedule.vehicle?.license_plate }}</div>
                    <div class="text-sm text-muted-foreground">{{ schedule.vehicle?.brand }} {{ schedule.vehicle?.model }}</div>
                  </TableCell>
                  <TableCell>
                    <div class="font-medium">{{ schedule.departure_time }}</div>
                    <div class="text-sm text-muted-foreground">Tiba: {{ schedule.arrival_time }}</div>
                  </TableCell>
                  <TableCell>Rp {{ formatPrice(schedule.price) }}</TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Badge variant="outline">{{ schedule.available_seats || 0 }}/{{ schedule.vehicle?.seat_capacity || 0 }}</Badge>
                      <Button size="sm" variant="ghost" @click="viewSeats(schedule)">
                        <Eye class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" @click="editSchedule(schedule)">Edit</Button>
                      <Button size="sm" variant="destructive" @click="deleteSchedule(schedule.id)">Hapus</Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>

    <!-- Schedule Dialog -->
    <Dialog v-model:open="showScheduleDialog">
      <DialogContent class="max-w-2xl">
        <DialogTitle>{{ isEditSchedule ? 'Edit' : 'Tambah' }} Jadwal</DialogTitle>
        <DialogDescription>{{ isEditSchedule ? 'Ubah' : 'Buat' }} jadwal keberangkatan bus</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Rute</Label>
              <select v-model="scheduleForm.route_id" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Rute</option>
                <option v-for="route in routes" :key="route.id" :value="route.id">
                  {{ route.origin_terminal?.city?.name }} - {{ route.destination_terminal?.city?.name }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>Kendaraan</Label>
              <select v-model="scheduleForm.vehicle_id" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Kendaraan</option>
                <option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.id">
                  {{ vehicle.license_plate }} - {{ vehicle.brand }} ({{ vehicle.seat_capacity }} kursi)
                </option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <Label>Tanggal Keberangkatan</Label>
              <Input v-model="scheduleForm.travel_date" type="date" @change="checkAvailableVehicles" />
            </div>
            <div class="space-y-2">
              <Label>Waktu Berangkat</Label>
              <Input v-model="scheduleForm.departure_time" type="time" @change="checkAvailableVehicles" />
            </div>
            <div class="space-y-2">
              <Label>Waktu Tiba</Label>
              <Input v-model="scheduleForm.arrival_time" type="time" />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Harga Tiket</Label>
            <Input v-model="scheduleForm.price" type="number" placeholder="Contoh: 150000" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showScheduleDialog = false">Batal</Button>
          <Button @click="submitSchedule" :disabled="submittingSchedule">
            {{ submittingSchedule ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Seats View Dialog -->
    <Dialog v-model:open="showSeatsDialog">
      <DialogContent class="max-w-4xl">
        <DialogTitle>Peta Kursi - {{ selectedSchedule?.route?.origin_terminal?.city?.name }} ke {{ selectedSchedule?.route?.destination_terminal?.city?.name }}</DialogTitle>
        <DialogDescription>{{ formatDate(selectedSchedule?.travel_date) }} - {{ selectedSchedule?.departure_time }}</DialogDescription>
        
        <div class="py-4">
          <div class="grid grid-cols-4 gap-2 max-w-md mx-auto">
            <div v-for="seat in scheduleSeats" :key="seat.id" class="relative">
              <div 
                :class="[
                  'w-12 h-12 rounded border-2 flex items-center justify-center text-sm font-medium',
                  seat.is_available ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'
                ]"
              >
                {{ seat.seat_number }}
              </div>
              <div v-if="!seat.is_available" class="absolute -bottom-6 left-0 right-0 text-xs text-center text-muted-foreground">
                {{ seat.ticket?.transaction?.trx_code || 'Booked' }}
              </div>
            </div>
          </div>
          
          <div class="flex justify-center gap-6 mt-8">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span class="text-sm">Tersedia</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span class="text-sm">Terisi</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogDescription>Yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showDeleteDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmDeleteSchedule">Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Plus, Search, Eye } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()

const loadingSchedules = ref(false)
const submittingSchedule = ref(false)
const schedules = ref<any[]>([])
const routes = ref<any[]>([])
const vehicles = ref<any[]>([])
const availableVehicles = ref<any[]>([])
const scheduleSeats = ref<any[]>([])

const showScheduleDialog = ref(false)
const showSeatsDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditSchedule = ref(false)
const selectedSchedule = ref<any>(null)
const scheduleToDelete = ref<number | null>(null)

const filters = ref({
  date: '',
  route_id: '',
  vehicle_id: ''
})

const scheduleForm = ref({
  route_id: '',
  vehicle_id: '',
  travel_date: '',
  departure_time: '',
  arrival_time: '',
  price: ''
})

onMounted(() => {
  fetchSchedules()
  fetchRoutes()
  fetchVehicles()
})

const fetchSchedules = async () => {
  loadingSchedules.value = true
  try {
    const params = new URLSearchParams()
    if (filters.value.date) params.append('date', filters.value.date)
    if (filters.value.route_id) params.append('route_id', filters.value.route_id)
    if (filters.value.vehicle_id) params.append('vehicle_id', filters.value.vehicle_id)
    
    const response = await api.get(`/admin/schedules?${params.toString()}`)
    schedules.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    toast({ title: 'Error', description: 'Gagal memuat jadwal', variant: 'destructive' })
  } finally {
    loadingSchedules.value = false
  }
}

const fetchRoutes = async () => {
  try {
    const response = await api.get('/routes')
    routes.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch routes:', error)
  }
}

const fetchVehicles = async () => {
  try {
    const response = await api.get('/vehicles')
    vehicles.value = response.data.data || []
    availableVehicles.value = vehicles.value
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
  }
}

const checkAvailableVehicles = async () => {
  if (!scheduleForm.value.travel_date || !scheduleForm.value.departure_time) {
    availableVehicles.value = vehicles.value
    return
  }
  
  try {
    const response = await api.get('/admin/schedules/available-vehicles', {
      params: {
        date: scheduleForm.value.travel_date,
        departure_time: scheduleForm.value.departure_time
      }
    })
    availableVehicles.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch available vehicles:', error)
  }
}

const openScheduleDialog = () => {
  isEditSchedule.value = false
  scheduleForm.value = {
    route_id: '',
    vehicle_id: '',
    travel_date: '',
    departure_time: '',
    arrival_time: '',
    price: ''
  }
  availableVehicles.value = vehicles.value
  showScheduleDialog.value = true
}

const editSchedule = (schedule: any) => {
  isEditSchedule.value = true
  scheduleForm.value = {
    route_id: schedule.route_id,
    vehicle_id: schedule.vehicle_id,
    travel_date: schedule.travel_date,
    departure_time: schedule.departure_time,
    arrival_time: schedule.arrival_time,
    price: schedule.price
  }
  selectedSchedule.value = schedule
  availableVehicles.value = vehicles.value
  showScheduleDialog.value = true
}

const submitSchedule = async () => {
  submittingSchedule.value = true
  try {
    if (isEditSchedule.value) {
      await api.put(`/admin/schedules/${selectedSchedule.value.id}`, scheduleForm.value)
      toast({ title: 'Berhasil', description: 'Jadwal berhasil diupdate' })
    } else {
      await api.post('/admin/schedules', scheduleForm.value)
      toast({ title: 'Berhasil', description: 'Jadwal berhasil ditambahkan' })
    }
    showScheduleDialog.value = false
    fetchSchedules()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menyimpan jadwal', variant: 'destructive' })
  } finally {
    submittingSchedule.value = false
  }
}

const viewSeats = async (schedule: any) => {
  selectedSchedule.value = schedule
  try {
    const response = await api.get(`/admin/schedules/${schedule.id}`)
    scheduleSeats.value = response.data.data.seats || []
    showSeatsDialog.value = true
  } catch (error) {
    toast({ title: 'Error', description: 'Gagal memuat data kursi', variant: 'destructive' })
  }
}

const deleteSchedule = (id: number) => {
  scheduleToDelete.value = id
  showDeleteDialog.value = true
}

const confirmDeleteSchedule = async () => {
  if (!scheduleToDelete.value) return
  try {
    await api.delete(`/admin/schedules/${scheduleToDelete.value}`)
    toast({ title: 'Berhasil', description: 'Jadwal berhasil dihapus' })
    fetchSchedules()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menghapus jadwal', variant: 'destructive' })
  } finally {
    showDeleteDialog.value = false
    scheduleToDelete.value = null
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID').format(price)
}
</script>