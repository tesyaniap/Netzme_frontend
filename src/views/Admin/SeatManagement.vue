<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Manajemen Kursi</h1>
            <p class="text-muted-foreground mt-1">Kelola kursi kendaraan</p>
          </div>
          <Button @click="openGenerateDialog">
            <Plus class="mr-2 h-4 w-4" />
            Generate Kursi
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Kursi</CardTitle>
            <CardDescription>{{ seats.length }} kursi terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="mb-4">
              <Label>Filter Kendaraan</Label>
              <select v-model="selectedVehicleId" @change="fetchSeats" class="w-full max-w-xs rounded-md border px-3 py-2 text-sm">
                <option value="">Semua Kendaraan</option>
                <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                  {{ vehicle.name }} - {{ vehicle.plate_number }}
                </option>
              </select>
            </div>

            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="seats.length === 0" class="text-center py-8 text-muted-foreground">
              Belum ada kursi
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Kursi</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead>Baris</TableHead>
                  <TableHead>Kolom</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="seat in paginatedSeats" :key="seat.id">
                  <TableCell class="font-medium">{{ seat.seat_number }}</TableCell>
                  <TableCell>{{ seat.vehicle?.name || '-' }}</TableCell>
                  <TableCell>{{ seat.row }}</TableCell>
                  <TableCell>{{ seat.column }}</TableCell>
                  <TableCell class="text-right">
                    <Button size="sm" variant="outline" @click="editSeat(seat)">Edit</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div v-if="seats.length > perPage" class="flex items-center justify-between pt-4 border-t mt-4">
              <div class="text-sm text-muted-foreground">
                Menampilkan {{ ((currentPage - 1) * perPage) + 1 }} - {{ Math.min(currentPage * perPage, seats.length) }} dari {{ seats.length }} data
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

    <!-- Generate Seats Dialog -->
    <Dialog v-model:open="showGenerateDialog">
      <DialogContent>
        <DialogTitle>Generate Kursi</DialogTitle>
        <DialogDescription>Generate kursi otomatis untuk kendaraan</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Kendaraan</Label>
            <select v-model="generateForm.vehicle_id" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Kendaraan</option>
              <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                {{ vehicle.name }} - {{ vehicle.plate_number }} ({{ vehicle.seat_capacity }} kursi)
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Layout</Label>
            <select v-model="generateForm.layout" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="2-2">2-2</option>
              <option value="2-3">2-3</option>
              <option value="1-2">1-2</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showGenerateDialog = false">Batal</Button>
          <Button @click="generateSeats" :disabled="submitting">
            {{ submitting ? 'Generating...' : 'Generate' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Edit Seat Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent>
        <DialogTitle>Edit Kursi</DialogTitle>
        <DialogDescription>Edit informasi kursi</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Nomor Kursi</Label>
            <Input v-model="editForm.seat_number" placeholder="A1" />
          </div>
          <div class="space-y-2">
            <Label>Baris</Label>
            <Input v-model.number="editForm.row" type="number" placeholder="1" />
          </div>
          <div class="space-y-2">
            <Label>Kolom</Label>
            <Input v-model.number="editForm.column" type="number" placeholder="1" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showEditDialog = false">Batal</Button>
          <Button @click="updateSeat" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan' }}
          </Button>
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
import { seatService } from '@/services/seat.service'
import { vehicleService } from '@/services/vehicle.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const seats = ref<any[]>([])
const vehicles = ref<any[]>([])
const selectedVehicleId = ref('')
const showGenerateDialog = ref(false)
const showEditDialog = ref(false)
const selectedSeat = ref<any>(null)

const currentPage = ref(1)
const perPage = 10

const generateForm = ref({
  vehicle_id: '',
  layout: '2-2'
})

const editForm = ref({
  seat_number: '',
  row: 1,
  column: 1
})

const paginatedSeats = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return seats.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(seats.value.length / perPage))

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
  fetchSeats()
  fetchVehicles()
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  router.push({ query: { page } })
}

const fetchSeats = async () => {
  loading.value = true
  try {
    const response = await seatService.getAll()
    let allSeats = response.data || []
    
    if (selectedVehicleId.value) {
      allSeats = allSeats.filter(seat => seat.vehicle_id == selectedVehicleId.value)
    }
    
    seats.value = allSeats
  } catch (error) {
    console.error('Failed to fetch seats:', error)
    toast({ title: 'Error', description: 'Gagal memuat data kursi', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const fetchVehicles = async () => {
  try {
    const response = await vehicleService.getAll()
    vehicles.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
  }
}

const openGenerateDialog = () => {
  generateForm.value = {
    vehicle_id: '',
    layout: '2-2'
  }
  showGenerateDialog.value = true
}

const generateSeats = async () => {
  if (!generateForm.value.vehicle_id) {
    toast({ title: 'Error', description: 'Pilih kendaraan terlebih dahulu', variant: 'destructive' })
    return
  }

  submitting.value = true
  try {
    const selectedVehicle = vehicles.value.find(v => v.id == generateForm.value.vehicle_id)
    
    await seatService.generateSeats({
      vehicle_id: parseInt(generateForm.value.vehicle_id),
      seat_capacity: selectedVehicle?.seat_capacity || 40,
      layout: generateForm.value.layout
    })
    
    toast({ 
      title: 'Berhasil', 
      description: 'Kursi berhasil digenerate',
      class: 'bg-green-500 text-white border-green-600'
    })
    
    showGenerateDialog.value = false
    fetchSeats()
  } catch (error: any) {
    let errorMsg = 'Gagal generate kursi'
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    }
    
    toast({ 
      title: 'Gagal', 
      description: errorMsg, 
      variant: 'destructive' 
    })
  } finally {
    submitting.value = false
  }
}

const editSeat = (seat: any) => {
  selectedSeat.value = seat
  editForm.value = {
    seat_number: seat.seat_number,
    row: seat.row,
    column: seat.column
  }
  showEditDialog.value = true
}

const updateSeat = async () => {
  if (!selectedSeat.value) return

  submitting.value = true
  try {
    await seatService.update(selectedSeat.value.id, {
      vehicle_id: selectedSeat.value.vehicle_id,
      seat_number: editForm.value.seat_number,
      row: editForm.value.row,
      column: editForm.value.column
    })
    
    toast({ 
      title: 'Berhasil', 
      description: 'Kursi berhasil diupdate',
      class: 'bg-green-500 text-white border-green-600'
    })
    
    showEditDialog.value = false
    fetchSeats()
  } catch (error: any) {
    let errorMsg = 'Gagal update kursi'
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    }
    
    toast({ 
      title: 'Gagal', 
      description: errorMsg, 
      variant: 'destructive' 
    })
  } finally {
    submitting.value = false
  }
}
</script>