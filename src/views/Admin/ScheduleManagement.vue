<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Manajemen Jadwal</h1>
            <p class="text-muted-foreground mt-1">Kelola jadwal perjalanan bus</p>
          </div>
          <Button @click="openScheduleDialog">
            <Plus class="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        </div>

        <!-- Filters -->
        <Card>
          <CardContent class="pt-6">
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex-1">
                <Label>Filter Rute</Label>
                <select v-model="routeFilter" @change="fetchSchedules" class="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">Semua Rute</option>
                  <option v-for="route in routes" :key="route.id" :value="route.id">
                    {{ route.origin_city?.name }} → {{ route.destination_city?.name }}
                  </option>
                </select>
              </div>
              <div class="flex-1">
                <Label>Filter Tanggal</Label>
                <Input v-model="dateFilter" type="date" @change="fetchSchedules" />
              </div>
              <div class="flex items-end">
                <Button @click="clearFilters" variant="outline">Reset</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Jadwal</CardTitle>
            <CardDescription>{{ schedules.length }} jadwal tersedia</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="schedules.length === 0" class="text-center py-8 text-muted-foreground">
              Tidak ada jadwal ditemukan
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Rute</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="schedule in schedules" :key="schedule.id">
                  <TableCell>
                    <div>
                      <p class="font-medium">{{ schedule.route?.origin_city?.name }} → {{ schedule.route?.destination_city?.name }}</p>
                      <p class="text-sm text-muted-foreground">{{ schedule.route?.departure_terminal?.name }} - {{ schedule.route?.arrival_terminal?.name }}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p class="font-medium">{{ schedule.vehicle?.name }}</p>
                      <p class="text-sm text-muted-foreground">{{ schedule.vehicle?.plate_number }}</p>
                    </div>
                  </TableCell>
                  <TableCell>{{ formatDate(schedule.travel_date) }}</TableCell>
                  <TableCell>
                    <div>
                      <p>{{ schedule.departure_time }}</p>
                      <p class="text-sm text-muted-foreground">{{ schedule.arrival_time }}</p>
                    </div>
                  </TableCell>
                  <TableCell>{{ formatCurrency(schedule.price) }}</TableCell>
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
        <DialogTitle>{{ isEdit ? 'Edit' : 'Tambah' }} Jadwal (Mode: {{ isEdit ? 'Edit' : 'Create' }})</DialogTitle>
        <DialogDescription>{{ isEdit ? 'Ubah' : 'Tambahkan' }} jadwal perjalanan</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Rute</Label>
              <select v-model="scheduleForm.route_id" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Rute</option>
                <option v-for="route in routes" :key="route.id" :value="route.id">
                  {{ route.origin_city?.name }} → {{ route.destination_city?.name }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>Kendaraan</Label>
              <select v-model="scheduleForm.vehicle_id" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Kendaraan</option>
                <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                  {{ vehicle.name }} ({{ vehicle.plate_number }})
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Tanggal Perjalanan</Label>
            <Input v-model="scheduleForm.travel_date" type="date" />
            <p class="text-xs text-muted-foreground">Kosongkan untuk jadwal template harian</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Waktu Keberangkatan</Label>
              <Input v-model="scheduleForm.departure_time" type="time" placeholder="14:30" />
              <p class="text-xs text-muted-foreground">Format: HH:MM (24 jam)</p>
            </div>
            <div class="space-y-2">
              <Label>Waktu Tiba</Label>
              <Input v-model="scheduleForm.arrival_time" type="time" placeholder="18:45" />
              <p class="text-xs text-muted-foreground">Format: HH:MM (24 jam)</p>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Harga Tiket</Label>
            <Input v-model.number="scheduleForm.price" type="number" placeholder="150000" />
          </div>

        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showScheduleDialog = false">Batal</Button>
          <Button @click="submitSchedule" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogDescription>Yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showDeleteDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmDelete">Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()

const loading = ref(false)
const submitting = ref(false)
const schedules = ref<any[]>([])
const routes = ref<any[]>([])
const vehicles = ref<any[]>([])

const showScheduleDialog = ref(false)
const showDeleteDialog = ref(false)
const isEdit = ref(false)
const selectedSchedule = ref<any>(null)
const scheduleToDelete = ref<number | null>(null)

const routeFilter = ref('')
const dateFilter = ref('')

const scheduleForm = ref({
  route_id: '',
  vehicle_id: '',
  travel_date: '',
  departure_time: '',
  arrival_time: '',
  price: 0
})

onMounted(() => {
  fetchSchedules()
  fetchRoutes()
  fetchVehicles()
})

const fetchSchedules = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (routeFilter.value) params.route_id = routeFilter.value
    if (dateFilter.value) params.travel_date = dateFilter.value

    const response = await api.get('/schedules', { params })
    
    // Handle both response formats
    if (response.data.success || response.data.status) {
      schedules.value = response.data.data || []
    }
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    toast({ title: 'Error', description: 'Gagal memuat data jadwal', variant: 'destructive' })
  } finally {
    loading.value = false
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
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
  }
}

const clearFilters = () => {
  routeFilter.value = ''
  dateFilter.value = ''
  fetchSchedules()
}

const openScheduleDialog = () => {
  console.log('Open new schedule dialog')
  isEdit.value = false
  console.log('isEdit set to:', isEdit.value)
  
  scheduleForm.value = {
    route_id: '',
    vehicle_id: '',
    travel_date: '',
    departure_time: '',
    arrival_time: '',
    price: 0
  }
  
  selectedSchedule.value = null
  console.log('Form reset for new schedule')
  showScheduleDialog.value = true
}

const editSchedule = (schedule: any) => {
  console.log('Edit schedule called with:', schedule)
  isEdit.value = true
  console.log('isEdit set to:', isEdit.value)
  
  scheduleForm.value = {
    route_id: schedule.route_id,
    vehicle_id: schedule.vehicle_id,
    travel_date: schedule.travel_date ? schedule.travel_date.split('T')[0] : '', // Format date for input
    departure_time: schedule.departure_time ? schedule.departure_time.substring(0, 5) : '', // Remove seconds: 16:00:00 -> 16:00
    arrival_time: schedule.arrival_time ? schedule.arrival_time.substring(0, 5) : '', // Remove seconds: 22:00:00 -> 22:00
    price: Number(schedule.price)
  }
  
  console.log('Form data set to:', scheduleForm.value)
  selectedSchedule.value = schedule
  console.log('Selected schedule set to:', selectedSchedule.value)
  showScheduleDialog.value = true
}

const submitSchedule = async () => {
  // Validate required fields
  if (!scheduleForm.value.route_id || !scheduleForm.value.vehicle_id || 
      !scheduleForm.value.departure_time || !scheduleForm.value.arrival_time || 
      !scheduleForm.value.price) {
    toast({ title: 'Error', description: 'Semua field wajib diisi', variant: 'destructive' })
    return
  }

  // Validate time format (H:i)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(scheduleForm.value.departure_time)) {
    toast({ title: 'Error', description: 'Format waktu keberangkatan tidak valid (gunakan HH:MM)', variant: 'destructive' })
    return
  }
  if (!timeRegex.test(scheduleForm.value.arrival_time)) {
    toast({ title: 'Error', description: 'Format waktu tiba tidak valid (gunakan HH:MM)', variant: 'destructive' })
    return
  }

  console.log('Original times:', {
    departure: scheduleForm.value.departure_time,
    arrival: scheduleForm.value.arrival_time
  })

  submitting.value = true
  try {
    const payload = { ...scheduleForm.value }
    
    console.log('Original travel_date from form:', scheduleForm.value.travel_date)
    console.log('Travel date type:', typeof scheduleForm.value.travel_date)
    console.log('Travel date length:', scheduleForm.value.travel_date?.length)
    
    // Don't delete travel_date if it's empty - send it as null or empty string
    if (!payload.travel_date || payload.travel_date.trim() === '') {
      console.log('Setting travel_date to null (template schedule)')
      payload.travel_date = null // Send null for template schedules
    } else {
      console.log('Keeping travel_date:', payload.travel_date)
    }

    // Ensure time format is correct
    payload.departure_time = formatTimeForAPI(payload.departure_time)
    payload.arrival_time = formatTimeForAPI(payload.arrival_time)

    console.log('Original form times:', {
      departure: scheduleForm.value.departure_time,
      arrival: scheduleForm.value.arrival_time
    })
    console.log('Formatted times for API:', {
      departure: payload.departure_time,
      arrival: payload.arrival_time
    })
    console.log('Full payload before send:', JSON.stringify(payload, null, 2))
    console.log('Is edit mode:', isEdit.value)
    console.log('Selected schedule ID:', selectedSchedule.value?.id)

    if (isEdit.value) {
      await api.put(`/schedules/${selectedSchedule.value.id}`, payload)
      toast({ title: 'Berhasil', description: 'Jadwal berhasil diupdate' })
    } else {
      await api.post('/schedules', payload)
      toast({ title: 'Berhasil', description: 'Jadwal berhasil ditambahkan' })
    }
    showScheduleDialog.value = false
    isEdit.value = false // Reset edit mode
    selectedSchedule.value = null // Reset selected schedule
    fetchSchedules()
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Gagal menyimpan jadwal'
    toast({ title: 'Error', description: errorMsg, variant: 'destructive' })
  } finally {
    submitting.value = false
  }
}

const deleteSchedule = async (id: number) => {
  showDeleteDialog.value = true
  scheduleToDelete.value = id
}

const confirmDelete = async () => {
  if (!scheduleToDelete.value) return
  try {
    await api.delete(`/schedules/${scheduleToDelete.value}`)
    toast({ title: 'Berhasil', description: 'Jadwal berhasil dihapus' })
    fetchSchedules()
  } catch (error: any) {
    toast({ title: 'Error', description: error.message || 'Gagal menghapus jadwal', variant: 'destructive' })
  } finally {
    showDeleteDialog.value = false
    scheduleToDelete.value = null
  }
}

const formatDate = (date: string) => {
  if (!date || date === 'null' || date === null || date === undefined) return 'Template Harian'
  
  try {
    let dateObj
    if (date.includes('T')) {
      dateObj = new Date(date)
    } else {
      dateObj = new Date(date + 'T00:00:00')
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Template Harian'
    }
    
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch (error) {
    return 'Template Harian'
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatTimeForAPI = (time: string) => {
  // Laravel H:i format expects: 00:00, 01:30, 14:45, 23:59
  // WITH leading zeros for hours (00-23)
  if (!time) return time
  
  // Remove seconds if present: 16:00:00 -> 16:00
  const timeParts = time.split(':')
  if (timeParts.length >= 2) {
    const hours = parseInt(timeParts[0], 10)
    const minutes = parseInt(timeParts[1], 10)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  return time
}
</script>