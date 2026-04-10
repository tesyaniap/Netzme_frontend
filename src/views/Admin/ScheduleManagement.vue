<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />

      <div class="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-6">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 class="text-xl sm:text-2xl font-semibold text-foreground">Jadwal Perjalanan</h1>
            <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">Kelola jadwal keberangkatan bus</p>
          </div>
          <Button @click="openScheduleDialog" class="w-full sm:w-auto">
            <Plus class="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        </div>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3">
          <select
            v-model="routeFilter"
            @change="fetchSchedules"
            class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring flex-1"
          >
            <option value="">Semua Rute</option>
            <option v-for="route in routes" :key="route.id" :value="route.id">
              {{ route.origin_city?.name }} → {{ route.destination_city?.name }}
            </option>
          </select>
          <Input v-model="dateFilter" type="date" @change="fetchSchedules" class="h-9 flex-1 sm:max-w-[200px]" />
          <Button variant="outline" size="sm" @click="clearFilters" class="h-9 px-4 w-full sm:w-auto">Reset</Button>
        </div>

        <!-- Table Card -->
        <Card>
          <CardContent class="p-0">
            <div v-if="loading" class="flex items-center justify-center py-12 sm:py-16 text-sm text-muted-foreground">
              Memuat data...
            </div>
            <div v-else-if="schedules.length === 0" class="flex flex-col items-center justify-center py-12 sm:py-16 gap-2">
              <p class="text-sm font-medium text-foreground">Belum ada jadwal</p>
              <p class="text-xs text-muted-foreground text-center px-4">Klik "Tambah Jadwal" untuk membuat jadwal baru</p>
            </div>
            <div v-else class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow class="border-b">
                    <TableHead class="pl-3 sm:pl-6 min-w-[150px]">Rute</TableHead>
                    <TableHead class="min-w-[120px]">Kendaraan</TableHead>
                    <TableHead class="min-w-[100px]">Tanggal</TableHead>
                    <TableHead class="min-w-[80px]">Jam</TableHead>
                    <TableHead class="min-w-[100px]">Harga</TableHead>
                    <TableHead class="pr-3 sm:pr-6 text-right min-w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="schedule in schedules" :key="schedule.id" class="hover:bg-muted/40 transition-colors">
                    <TableCell class="pl-3 sm:pl-6">
                      <p class="font-medium text-xs sm:text-sm">
                        {{ schedule.route?.origin_city?.name }} → {{ schedule.route?.destination_city?.name }}
                      </p>
                      <p class="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                        {{ schedule.route?.departure_terminal?.name }} · {{ schedule.route?.arrival_terminal?.name }}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p class="text-xs sm:text-sm font-medium">{{ schedule.vehicle?.name }}</p>
                      <p class="text-xs text-muted-foreground mt-0.5 hidden sm:block">{{ schedule.vehicle?.plate_number }}</p>
                    </TableCell>
                    <TableCell class="text-xs sm:text-sm">{{ formatDate(schedule.travel_date) }}</TableCell>
                    <TableCell>
                      <p class="text-xs sm:text-sm font-medium">{{ schedule.departure_time?.substring(0,5) }}</p>
                      <p class="text-xs text-muted-foreground mt-0.5 hidden sm:block"> {{ schedule.arrival_time?.substring(0,5) }}</p>
                    </TableCell>
                    <TableCell class="text-xs sm:text-sm font-medium">{{ formatCurrency(schedule.price) }}</TableCell>
                    <TableCell class="pr-3 sm:pr-6 text-right">
                      <div class="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                        <Button size="sm" variant="outline" @click="editSchedule(schedule)" class="h-7 sm:h-8 px-2 sm:px-3 text-xs">Edit</Button>
                        <Button size="sm" variant="destructive" @click="deleteSchedule(schedule.id)" class="h-7 sm:h-8 px-2 sm:px-3 text-xs">Hapus</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>

    <!-- ── Schedule Dialog ── -->
    <Dialog v-model:open="showScheduleDialog">
      <DialogContent class="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>{{ isEdit ? 'Edit Jadwal' : 'Tambah Jadwal' }}</DialogTitle>
        <DialogDescription>{{ isEdit ? 'Ubah detail jadwal yang sudah ada.' : 'Buat jadwal keberangkatan baru.' }}</DialogDescription>

        <div class="space-y-5 pt-2">

          <!-- ── RUTE ── -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-sm font-medium">Rute</Label>
              <button
                type="button"
                @click="toggleRouteMode"
                class="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
              >
                {{ routeMode === 'select' ? ' Buat rute baru' : ' Pilih rute yang ada' }}
              </button>
            </div>

            <!-- Mode: pilih existing -->
            <div v-if="routeMode === 'select'">
              <select
                v-model="scheduleForm.route_id"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Pilih rute --</option>
                <option v-for="route in routes" :key="route.id" :value="route.id">
                  {{ route.origin_city?.name }} → {{ route.destination_city?.name }}
                </option>
              </select>

              <!-- Preview rute terpilih -->
              <div v-if="selectedRoute" class="mt-2 px-3 py-2 rounded-md bg-muted text-xs text-muted-foreground">
                Terminal: {{ selectedRoute.departure_terminal?.name }} → {{ selectedRoute.arrival_terminal?.name }}
              </div>
            </div>

            <!-- Mode: buat rute baru -->
            <div v-else class="rounded-md border border-dashed p-4 space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">Kota asal</Label>
                  <select
                    v-model="newRoute.origin_city_id"
                    @change="loadOriginTerminals"
                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Pilih kota</option>
                    <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">Terminal keberangkatan</Label>
                  <select
                    v-model="newRoute.departure_terminal_id"
                    :disabled="!newRoute.origin_city_id"
                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Pilih terminal</option>
                    <option v-for="t in originTerminals" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">Kota tujuan</Label>
                  <select
                    v-model="newRoute.destination_city_id"
                    @change="loadDestinationTerminals"
                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Pilih kota</option>
                    <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">Terminal kedatangan</Label>
                  <select
                    v-model="newRoute.arrival_terminal_id"
                    :disabled="!newRoute.destination_city_id"
                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Pilih terminal</option>
                    <option v-for="t in destinationTerminals" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1.5">
                <Label class="text-xs text-muted-foreground">Jarak (km)</Label>
                <Input v-model.number="newRoute.distance" type="number" placeholder="cth: 150" class="h-9" />
              </div>
              <Button
                type="button"
                size="sm"
                class="w-full h-9"
                @click="createRouteInline"
                :disabled="creatingRoute"
              >
                {{ creatingRoute ? 'Menyimpan rute...' : 'Simpan & gunakan rute ini' }}
              </Button>
            </div>
          </div>

          <!-- ── KENDARAAN ── -->
          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Kendaraan</Label>
            <select
              v-model="scheduleForm.vehicle_id"
              class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- Pilih kendaraan --</option>
              <option v-for="v in vehicles" :key="v.id" :value="v.id">
                {{ v.name }} · {{ v.plate_number }} ({{ v.seat_capacity }} kursi)
              </option>
            </select>
          </div>

          <!-- ── TANGGAL ── -->
          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Tanggal Perjalanan</Label>
            <Input v-model="scheduleForm.travel_date" type="date" class="h-9" />
            <p class="text-xs text-muted-foreground">Kosongkan jika jadwal berlaku harian</p>
          </div>

          <!-- ── JAM ── -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label class="text-sm font-medium">Jam Berangkat</Label>
              <Input v-model="scheduleForm.departure_time" type="time" class="h-9" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-sm font-medium">Jam Tiba</Label>
              <Input v-model="scheduleForm.arrival_time" type="time" class="h-9" />
            </div>
          </div>

          <!-- ── HARGA ── -->
          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Harga Tiket (Rp)</Label>
            <Input v-model.number="scheduleForm.price" type="number" placeholder="cth: 150000" class="h-9" />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 pt-4 border-t mt-2">
          <Button variant="outline" @click="showScheduleDialog = false">Batal</Button>
          <Button @click="submitSchedule" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Jadwal' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Delete Dialog ── -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="max-w-sm">
        <DialogTitle>Hapus Jadwal?</DialogTitle>
        <DialogDescription>Jadwal yang dihapus tidak bisa dikembalikan.</DialogDescription>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" @click="showDeleteDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmDelete">Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>

  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()

// ── State ──
const loading = ref(false)
const submitting = ref(false)
const creatingRoute = ref(false)

const schedules = ref<any[]>([])
const routes = ref<any[]>([])
const vehicles = ref<any[]>([])
const cities = ref<any[]>([])
const originTerminals = ref<any[]>([])
const destinationTerminals = ref<any[]>([])

const showScheduleDialog = ref(false)
const showDeleteDialog = ref(false)
const isEdit = ref(false)
const selectedSchedule = ref<any>(null)
const scheduleToDelete = ref<number | null>(null)

const routeFilter = ref('')
const dateFilter = ref('')
const routeMode = ref<'select' | 'create'>('select')

const scheduleForm = ref({
  route_id: '' as string | number,
  vehicle_id: '' as string | number,
  travel_date: '',
  departure_time: '',
  arrival_time: '',
  price: 0
})

const newRoute = ref({
  origin_city_id: '',
  destination_city_id: '',
  departure_terminal_id: '',
  arrival_terminal_id: '',
  distance: 0
})

// ── Computed ──
const selectedRoute = computed(() =>
  routes.value.find(r => r.id == scheduleForm.value.route_id) ?? null
)

// ── Lifecycle ──
onMounted(() => {
  fetchSchedules()
  fetchRoutes()
  fetchVehicles()
  fetchCities()
})

// ── Fetch helpers ──
const fetchSchedules = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (routeFilter.value) params.route_id = routeFilter.value
    if (dateFilter.value) params.travel_date = dateFilter.value
    const res = await api.get('/schedules', { params })
    schedules.value = res.data.data || []
  } catch {
    toast({ title: 'Gagal memuat jadwal', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const fetchRoutes = async () => {
  try {
    const res = await api.get('/routes')
    routes.value = res.data.data || []
  } catch {}
}

const fetchVehicles = async () => {
  try {
    const res = await api.get('/vehicles')
    vehicles.value = res.data.data || []
  } catch {}
}

const fetchCities = async () => {
  try {
    const res = await api.get('/cities')
    cities.value = res.data.data || []
  } catch {}
}

const loadOriginTerminals = async () => {
  originTerminals.value = []
  newRoute.value.departure_terminal_id = ''
  if (!newRoute.value.origin_city_id) return
  try {
    const res = await api.get('/terminals', { params: { city_id: newRoute.value.origin_city_id } })
    originTerminals.value = res.data.data || []
  } catch {}
}

const loadDestinationTerminals = async () => {
  destinationTerminals.value = []
  newRoute.value.arrival_terminal_id = ''
  if (!newRoute.value.destination_city_id) return
  try {
    const res = await api.get('/terminals', { params: { city_id: newRoute.value.destination_city_id } })
    destinationTerminals.value = res.data.data || []
  } catch {}
}

// ── Dialog helpers ──
const openScheduleDialog = () => {
  isEdit.value = false
  selectedSchedule.value = null
  scheduleForm.value = { route_id: '', vehicle_id: '', travel_date: '', departure_time: '', arrival_time: '', price: 0 }
  routeMode.value = 'select'
  resetNewRoute()
  showScheduleDialog.value = true
}

const editSchedule = (schedule: any) => {
  isEdit.value = true
  selectedSchedule.value = schedule
  scheduleForm.value = {
    route_id: schedule.route_id,
    vehicle_id: schedule.vehicle_id,
    travel_date: schedule.travel_date?.split('T')[0] ?? '',
    departure_time: schedule.departure_time?.substring(0, 5) ?? '',
    arrival_time: schedule.arrival_time?.substring(0, 5) ?? '',
    price: Number(schedule.price)
  }
  routeMode.value = 'select'
  showScheduleDialog.value = true
}

const toggleRouteMode = () => {
  routeMode.value = routeMode.value === 'select' ? 'create' : 'select'
  if (routeMode.value === 'select') resetNewRoute()
}

const resetNewRoute = () => {
  newRoute.value = { origin_city_id: '', destination_city_id: '', departure_terminal_id: '', arrival_terminal_id: '', distance: 0 }
  originTerminals.value = []
  destinationTerminals.value = []
}

const clearFilters = () => {
  routeFilter.value = ''
  dateFilter.value = ''
  fetchSchedules()
}

// ── Route inline create ──
const createRouteInline = async () => {
  const { origin_city_id, destination_city_id, departure_terminal_id, arrival_terminal_id } = newRoute.value
  if (!origin_city_id || !destination_city_id || !departure_terminal_id || !arrival_terminal_id) {
    toast({ title: 'Validasi', description: 'Lengkapi semua field rute', variant: 'destructive' })
    return
  }
  if (origin_city_id === destination_city_id) {
    toast({ title: 'Validasi', description: 'Kota asal dan tujuan tidak boleh sama', variant: 'destructive' })
    return
  }
  creatingRoute.value = true
  try {
    const originCity = cities.value.find(c => c.id == origin_city_id)
    const destCity = cities.value.find(c => c.id == destination_city_id)
    const res = await api.post('/routes', {
      ...newRoute.value,
      name: `${originCity?.name} - ${destCity?.name}`
    })
    await fetchRoutes()
    scheduleForm.value.route_id = res.data.data.id
    routeMode.value = 'select'
    resetNewRoute()
    toast({ title: 'Rute dibuat', description: `${originCity?.name} → ${destCity?.name}` })
  } catch (e: any) {
    toast({ title: 'Error', description: e.response?.data?.message || 'Gagal membuat rute', variant: 'destructive' })
  } finally {
    creatingRoute.value = false
  }
}

// ── Submit schedule ──
const submitSchedule = async () => {
  if (!scheduleForm.value.route_id) {
    toast({ title: 'Validasi', description: 'Pilih rute terlebih dahulu', variant: 'destructive' })
    return
  }
  if (!scheduleForm.value.vehicle_id || !scheduleForm.value.departure_time || !scheduleForm.value.arrival_time || !scheduleForm.value.price) {
    toast({ title: 'Validasi', description: 'Semua field wajib diisi', variant: 'destructive' })
    return
  }
  submitting.value = true
  try {
    const payload = {
      ...scheduleForm.value,
      travel_date: scheduleForm.value.travel_date || null,
      departure_time: formatTime(scheduleForm.value.departure_time),
      arrival_time: formatTime(scheduleForm.value.arrival_time)
    }
    if (isEdit.value) {
      await api.put(`/schedules/${selectedSchedule.value.id}`, payload)
      toast({ title: 'Berhasil', description: 'Jadwal diperbarui' })
    } else {
      await api.post('/schedules', payload)
      toast({ title: 'Berhasil', description: 'Jadwal ditambahkan' })
    }
    showScheduleDialog.value = false
    isEdit.value = false
    selectedSchedule.value = null
    fetchSchedules()
  } catch (e: any) {
    toast({ title: 'Error', description: e.response?.data?.message || 'Gagal menyimpan', variant: 'destructive' })
  } finally {
    submitting.value = false
  }
}

// ── Delete ──
const deleteSchedule = (id: number) => {
  scheduleToDelete.value = id
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!scheduleToDelete.value) return
  try {
    await api.delete(`/schedules/${scheduleToDelete.value}`)
    toast({ title: 'Berhasil', description: 'Jadwal dihapus' })
    fetchSchedules()
  } catch {
    toast({ title: 'Error', description: 'Gagal menghapus jadwal', variant: 'destructive' })
  } finally {
    showDeleteDialog.value = false
    scheduleToDelete.value = null
  }
}

// ── Formatters ──
const formatDate = (date: string) => {
  if (!date) return 'Harian'
  try {
    return new Date(date.includes('T') ? date : date + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  } catch {
    return 'Harian'
  }
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const formatTime = (time: string) => {
  if (!time) return time
  const [h, m] = time.split(':')
  return `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`
}
</script>