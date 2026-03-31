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
          <Button @click="openAddDialog">
            <Plus class="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Jadwal</CardTitle>
                <CardDescription>{{ schedules.length }} jadwal terdaftar</CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 text-xs">
                  <div :class="['w-2 h-2 rounded-full', apiStatus.schedules === 'available' ? 'bg-green-500' : apiStatus.schedules === 'unavailable' ? 'bg-red-500' : 'bg-gray-400']"></div>
                  <span class="text-muted-foreground">API Status</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Memuat data jadwal...</p>
            </div>
            <div v-else-if="schedules.length === 0" class="text-center py-8 text-muted-foreground">
              <div class="mb-4">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada jadwal</h3>
              <p class="text-sm text-gray-500 mb-4">Tambahkan jadwal pertama atau pastikan backend API sudah berjalan</p>
              <Button @click="fetchSchedules" variant="outline" size="sm">
                <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Rute</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Keberangkatan</TableHead>
                  <TableHead>Kedatangan</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="schedule in paginatedSchedules" :key="schedule.id">
                  <TableCell class="font-medium">
                    <span v-if="schedule.route?.origin_city?.name && schedule.route?.destination_city?.name">
                      {{ schedule.route.origin_city.name }} - {{ schedule.route.destination_city.name }}
                    </span>
                    <span v-else class="text-muted-foreground italic">Rute tidak tersedia</span>
                  </TableCell>
                  <TableCell>
                    <span v-if="schedule.vehicle?.name">
                      {{ schedule.vehicle.name }}
                    </span>
                    <span v-else class="text-muted-foreground italic">Kendaraan tidak tersedia</span>
                  </TableCell>
                  <TableCell>
                    <span v-if="schedule.travel_date">
                      {{ formatDate(schedule.travel_date) }}
                    </span>
                    <span v-else class="text-muted-foreground italic">Tanggal tidak tersedia</span>
                  </TableCell>
                  <TableCell>{{ schedule.departure_time || '-' }}</TableCell>
                  <TableCell>{{ schedule.arrival_time || '-' }}</TableCell>
                  <TableCell>
                    <span v-if="schedule.price">
                      {{ formatCurrency(schedule.price) }}
                    </span>
                    <span v-else class="text-muted-foreground italic">Harga tidak tersedia</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" @click="viewDetail(schedule)">Detail</Button>
                      <Button size="sm" variant="outline" @click="openEditDialog(schedule)">Edit</Button>
                      <Button size="sm" variant="destructive" @click="deleteSchedule(schedule.id)">Hapus</Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div v-if="schedules.length > perPage" class="flex items-center justify-between pt-4 border-t mt-4">
              <div class="text-sm text-muted-foreground">
                Menampilkan {{ ((currentPage - 1) * perPage) + 1 }} - {{ Math.min(currentPage * perPage, schedules.length) }} dari {{ schedules.length }} data
              </div>
              <div class="flex gap-2">
                <Button size="sm" variant="outline" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Previous</Button>
                <Button v-for="page in visiblePages" :key="page" size="sm" :variant="page === currentPage ? 'default' : 'outline'" @click="goToPage(page)">{{ page }}</Button>
                <Button size="sm" variant="outline" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>

    <!-- Add/Edit Schedule Dialog -->
    <Dialog v-model:open="showFormDialog">
      <DialogContent class="max-w-2xl">
        <DialogTitle>{{ isEdit ? 'Edit Jadwal' : 'Tambah Jadwal' }}</DialogTitle>
        <DialogDescription>{{ isEdit ? 'Ubah jadwal keberangkatan bus' : 'Tambahkan jadwal keberangkatan baru' }}</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Rute</Label>
            <select v-model="form.route_id" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Rute</option>
              <option v-for="route in routes" :key="route.id" :value="route.id">
                {{ route.origin_city?.name }} - {{ route.destination_city?.name }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Kendaraan</Label>
            <select v-model="form.vehicle_id" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Kendaraan</option>
              <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                {{ vehicle.name }} - {{ vehicle.plate_number }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Tanggal Perjalanan</Label>
            <Input v-model="form.travel_date" type="date" :min="new Date().toISOString().split('T')[0]" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Waktu Keberangkatan</Label>
              <Input v-model="form.departure_time" type="time" />
            </div>
            <div class="space-y-2">
              <Label>Waktu Kedatangan</Label>
              <Input v-model="form.arrival_time" type="time" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Harga</Label>
            <Input v-model.number="form.price" type="number" placeholder="150000" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showFormDialog = false">Batal</Button>
          <Button @click="submitSchedule" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Detail Dialog -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-3xl">
        <DialogTitle>Detail Jadwal</DialogTitle>
        <DialogDescription>Informasi lengkap jadwal keberangkatan</DialogDescription>
        
        <div v-if="selectedSchedule" class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <p class="text-sm text-muted-foreground">Rute</p>
              <p class="font-medium text-lg">
                {{ selectedSchedule.route?.origin_city?.name }} - {{ selectedSchedule.route?.destination_city?.name }}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Terminal Keberangkatan</p>
              <p class="font-medium">{{ selectedSchedule.route?.departure_terminal?.name }}</p>
              <p class="text-xs text-muted-foreground">{{ selectedSchedule.route?.departure_terminal?.address }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Terminal Kedatangan</p>
              <p class="font-medium">{{ selectedSchedule.route?.arrival_terminal?.name }}</p>
              <p class="text-xs text-muted-foreground">{{ selectedSchedule.route?.arrival_terminal?.address }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Kendaraan</p>
              <p class="font-medium">{{ selectedSchedule.vehicle?.name }}</p>
              <p class="text-xs text-muted-foreground">{{ selectedSchedule.vehicle?.plate_number }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Kapasitas</p>
              <p class="font-medium">{{ selectedSchedule.vehicle?.seat_capacity }} kursi</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Tanggal Perjalanan</p>
              <p class="font-medium">{{ formatDate(selectedSchedule.travel_date) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Waktu Keberangkatan</p>
              <p class="font-medium">{{ selectedSchedule.departure_time }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Waktu Kedatangan</p>
              <p class="font-medium">{{ selectedSchedule.arrival_time }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Harga</p>
              <p class="font-medium text-lg text-primary">{{ formatCurrency(selectedSchedule.price) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Jarak</p>
              <p class="font-medium">{{ selectedSchedule.route?.distance }} km</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <Button variant="outline" @click="showDetailDialog = false">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { Plus } from 'lucide-vue-next'
import { scheduleService } from '@/services/schedule.service'
import { vehicleService } from '@/services/vehicle.service'
import { routeService } from '@/services/route.service'
import { transactionService } from '@/services/transaction.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const apiStatus = ref({ schedules: 'unknown', vehicles: 'unknown', routes: 'unknown' })
const schedules = ref<any[]>([])
const vehicles = ref<any[]>([])
const routes = ref<any[]>([])
const showFormDialog = ref(false)
const showDetailDialog = ref(false)
const selectedSchedule = ref<any>(null)
const isEdit = ref(false)

const currentPage = ref(1)
const perPage = 10

const form = ref({
  vehicle_id: '',
  route_id: '',
  travel_date: new Date().toISOString().split('T')[0], // Default to today
  departure_time: '',
  arrival_time: '',
  price: 0
})

const paginatedSchedules = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return schedules.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(schedules.value.length / perPage))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

onMounted(() => {
  currentPage.value = Number(route.query.page) || 1
  fetchSchedules()
  fetchVehicles()
  fetchRoutes()
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  router.push({ query: { page } })
}

const fetchSchedules = async () => {
  loading.value = true
  try {
    const response = await scheduleService.getAll({ page: currentPage.value, per_page: perPage })
    
    if (import.meta.env.DEV) {
      console.log('Schedule API Response:', response)
      console.log('Schedule data:', response.data)
    }
    
    schedules.value = response.data || []
    apiStatus.value.schedules = 'available'
  } catch (error: any) {
    console.error('Failed to fetch schedules:', error)
    schedules.value = []
    apiStatus.value.schedules = 'unavailable'
    
    // Show user-friendly message for API issues
    if (error.response?.status === 404) {
      toast({ 
        title: 'API Tidak Tersedia', 
        description: 'Endpoint jadwal belum tersedia. Pastikan backend sudah berjalan.', 
        variant: 'destructive' 
      })
    } else if (error.response?.status === 422) {
      toast({ 
        title: 'Parameter Error', 
        description: 'Ada masalah dengan parameter request. Periksa konfigurasi API.', 
        variant: 'destructive' 
      })
    }
  } finally {
    loading.value = false
  }
}

const fetchVehicles = async () => {
  try {
    const response = await vehicleService.getAll()
    
    if (import.meta.env.DEV) {
      console.log('Vehicle API Response:', response)
    }
    
    vehicles.value = response.data || []
  } catch (error: any) {
    console.error('Failed to fetch vehicles:', error)
    vehicles.value = []
    
    if (error.response?.status === 404) {
      toast({ 
        title: 'API Tidak Tersedia', 
        description: 'Endpoint kendaraan belum tersedia. Pastikan backend sudah berjalan.', 
        variant: 'destructive' 
      })
    }
  }
}

const fetchRoutes = async () => {
  try {
    const response = await routeService.getAll()
    
    if (import.meta.env.DEV) {
      console.log('Route API Response:', response)
    }
    
    routes.value = response.data || []
  } catch (error: any) {
    console.error('Failed to fetch routes:', error)
    routes.value = []
    
    if (error.response?.status === 404) {
      toast({ 
        title: 'API Tidak Tersedia', 
        description: 'Endpoint rute belum tersedia. Pastikan backend sudah berjalan.', 
        variant: 'destructive' 
      })
    }
  }
}

const openAddDialog = () => {
  form.value = { 
    vehicle_id: '', 
    route_id: '', 
    travel_date: new Date().toISOString().split('T')[0],
    departure_time: '', 
    arrival_time: '', 
    price: 0 
  }
  isEdit.value = false
  showFormDialog.value = true
}

const openEditDialog = (schedule: any) => {
  form.value = {
    vehicle_id: schedule.vehicle_id,
    route_id: schedule.route_id,
    travel_date: schedule.travel_date || new Date().toISOString().split('T')[0],
    departure_time: schedule.departure_time,
    arrival_time: schedule.arrival_time,
    price: schedule.price
  }
  selectedSchedule.value = schedule
  isEdit.value = true
  showFormDialog.value = true
}

const submitSchedule = async () => {
  if (!form.value.vehicle_id || !form.value.route_id) {
    toast({ title: 'Error', description: 'Lengkapi semua field', variant: 'destructive' })
    return
  }

  // Validate schedule data
  if (new Date(form.value.travel_date) < new Date()) {
    toast({ title: 'Error', description: 'Tanggal perjalanan tidak boleh di masa lalu', variant: 'destructive' })
    return
  }

  if (form.value.departure_time >= form.value.arrival_time) {
    toast({ title: 'Error', description: 'Waktu kedatangan harus setelah waktu keberangkatan', variant: 'destructive' })
    return
  }

  if (form.value.price <= 0) {
    toast({ title: 'Error', description: 'Harga harus lebih dari 0', variant: 'destructive' })
    return
  }

  submitting.value = true
  try {
    const payload = {
      vehicle_id: parseInt(form.value.vehicle_id),
      route_id: parseInt(form.value.route_id),
      travel_date: form.value.travel_date,
      departure_time: form.value.departure_time,
      arrival_time: form.value.arrival_time,
      price: parseInt(form.value.price.toString())
    }

    if (isEdit.value) {
      await scheduleService.update(selectedSchedule.value.id, payload)
      toast({ title: 'Berhasil', description: 'Jadwal berhasil diupdate', class: 'bg-green-500 text-white border-green-600' })
    } else {
      const response = await scheduleService.create(payload)
      if (response.success) {
        toast({ title: 'Berhasil', description: 'Jadwal berhasil ditambahkan', class: 'bg-green-500 text-white border-green-600' })
      }
    }
    showFormDialog.value = false
    fetchSchedules()
  } catch (error: any) {
    let errorMsg = 'Gagal menyimpan jadwal'
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    } else if (error.response?.data?.errors) {
      errorMsg = Object.values(error.response.data.errors).flat().join(', ')
    } else if (error.message) {
      errorMsg = error.message
    }
    toast({ title: 'Gagal', description: errorMsg, variant: 'destructive' })
  } finally {
    submitting.value = false
  }
}

const deleteSchedule = async (id: number) => {
  if (!confirm('Yakin ingin menghapus jadwal ini?')) return

  try {
    await scheduleService.delete(id)
    toast({ title: 'Berhasil', description: 'Jadwal berhasil dihapus', class: 'bg-green-500 text-white border-green-600' })
    fetchSchedules()
  } catch (error: any) {
    toast({ title: 'Gagal', description: error.response?.data?.message || 'Gagal menghapus jadwal', variant: 'destructive' })
  }
}

const viewDetail = (schedule: any) => {
  selectedSchedule.value = schedule
  showDetailDialog.value = true
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return '-'
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch (error) {
    console.warn('Invalid date format:', dateString)
    return '-'
  }
}

const formatCurrency = (value: any) => {
  if (!value || isNaN(value)) return 'Rp 0'
  
  try {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numericValue)
  } catch (error) {
    console.warn('Invalid currency value:', value)
    return 'Rp 0'
  }
}
</script>