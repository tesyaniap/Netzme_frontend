<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Kendaraan</h1>
            <p class="text-muted-foreground mt-1 text-sm sm:text-base">Kelola kendaraan dan kursi bus</p>
          </div>
          <Button @click="openVehicleDialog" class="w-full sm:w-auto">
            <Plus class="mr-2 h-4 w-4" />
            Tambah Kendaraan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Kendaraan</CardTitle>
            <CardDescription>{{ vehicles.length }} kendaraan terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="text-center py-6 sm:py-8 text-sm">Loading...</div>
            <div v-else-if="vehicles.length === 0" class="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
              Belum ada kendaraan
            </div>
            <div v-else class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="min-w-[120px]">Nama Kendaraan</TableHead>
                    <TableHead class="min-w-[100px]">Nomor Plat</TableHead>
                    <TableHead class="min-w-[100px]">Partner</TableHead>
                    <TableHead class="min-w-[80px]">Kapasitas</TableHead>
                    <TableHead class="min-w-[80px]">Layout</TableHead>
                    <TableHead class="min-w-[80px]">Kursi</TableHead>
                    <TableHead class="text-right min-w-[150px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="vehicle in vehicles" :key="vehicle.id">
                    <TableCell class="font-medium text-sm">{{ vehicle.name }}</TableCell>
                    <TableCell class="text-sm">{{ vehicle.plate_number }}</TableCell>
                    <TableCell class="text-sm">{{ vehicle.partner?.name || '-' }}</TableCell>
                    <TableCell class="text-sm">{{ vehicle.seat_capacity }} kursi</TableCell>
                    <TableCell>
                      <Badge variant="outline" class="text-xs">{{ vehicle.seat_layout }}</Badge>
                    </TableCell>
                    <TableCell>
                      <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span class="text-xs sm:text-sm">{{ vehicle.seats_count || 0 }} kursi</span>
                        <Button 
                          v-if="!vehicle.seats_count" 
                          size="sm" 
                          variant="outline" 
                          @click="generateSeats(vehicle)"
                          class="text-xs h-6 px-2"
                        >
                          Generate
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                        <Button size="sm" variant="outline" @click="viewSeats(vehicle)" class="text-xs h-7 px-2">Kursi</Button>
                        <Button size="sm" variant="outline" @click="editVehicle(vehicle)" class="text-xs h-7 px-2">Edit</Button>
                        <Button size="sm" variant="destructive" @click="deleteVehicle(vehicle.id)" class="text-xs h-7 px-2">Hapus</Button>
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

    <!-- Vehicle Dialog -->
    <Dialog v-model:open="showVehicleDialog">
      <DialogContent class="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <DialogTitle class="text-lg sm:text-xl">{{ isEdit ? 'Edit' : 'Tambah' }} Kendaraan</DialogTitle>
        <DialogDescription class="text-sm">{{ isEdit ? 'Ubah' : 'Tambahkan' }} data kendaraan</DialogDescription>
        
        <div class="space-y-3 sm:space-y-4 py-4">
          <div class="space-y-2">
            <Label class="text-sm">Nama Kendaraan</Label>
            <Input v-model="vehicleForm.name" placeholder="Contoh: Bus Ekonomi 01" class="text-sm" />
          </div>
          <div class="space-y-2">
            <Label class="text-sm">Nomor Plat</Label>
            <Input v-model="vehicleForm.plate_number" placeholder="Contoh: B 1234 ABC" class="text-sm" />
          </div>
          <div class="space-y-2">
            <Label class="text-sm">Partner/Mitra</Label>
            <select v-model="vehicleForm.partner_id" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Partner</option>
              <option v-for="partner in partners" :key="partner.id" :value="partner.id">
                {{ partner.name }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label class="text-sm">Kapasitas Kursi</Label>
            <Input v-model.number="vehicleForm.seat_capacity" type="number" placeholder="40" class="text-sm" />
          </div>
          <div class="space-y-2">
            <Label class="text-sm">Layout Kursi</Label>
            <select v-model="vehicleForm.seat_layout" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Layout</option>
              <option value="2-2">2-2 (Ekonomi)</option>
              <option value="2-1">2-1 (Eksekutif)</option>
              <option value="1-2">1-2 (VIP)</option>
              <option value="2-3">2-3 (Super Ekonomi)</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="outline" @click="showVehicleDialog = false" class="text-sm">Batal</Button>
          <Button @click="submitVehicle" :disabled="submitting" class="text-sm">
            {{ submitting ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Seats Dialog -->
    <Dialog v-model:open="showSeatsDialog">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogTitle class="text-lg sm:text-xl">Kursi - {{ selectedVehicle?.name }}</DialogTitle>
        <DialogDescription class="text-sm">Layout kursi kendaraan</DialogDescription>
        
        <div v-if="loadingSeats" class="text-center py-6 sm:py-8 text-sm">Loading...</div>
        <div v-else-if="seats.length === 0" class="text-center py-6 sm:py-8">
          <p class="text-muted-foreground mb-4 text-sm">Belum ada kursi yang di-generate</p>
          <Button @click="generateSeats(selectedVehicle)" class="text-sm">Generate Kursi</Button>
        </div>
        <div v-else class="space-y-4">
          <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <p class="text-xs sm:text-sm text-muted-foreground">{{ seats.length }} kursi tersedia</p>
            <Button size="sm" variant="outline" @click="regenerateSeats" class="text-xs">Regenerate</Button>
          </div>
          
          <!-- Seat Map -->
          <div class="border rounded-lg p-3 sm:p-4 bg-gray-50">
            <div class="text-center mb-3 sm:mb-4 text-xs sm:text-sm font-medium">DEPAN BUS</div>
            <div v-if="seatsByRow" class="space-y-1 sm:space-y-2">
              <div v-for="(rowSeats, row) in seatsByRow" :key="row" class="flex justify-center gap-1 sm:gap-2">
                <div v-for="seat in rowSeats" :key="seat.id" class="w-8 h-8 sm:w-12 sm:h-10 border rounded flex items-center justify-center text-xs font-medium bg-white">
                  {{ seat.seat_number }}
                </div>
              </div>
            </div>
            <div class="text-center mt-3 sm:mt-4 text-xs sm:text-sm font-medium">BELAKANG BUS</div>
          </div>
        </div>

        <div class="flex justify-end">
          <Button variant="outline" @click="showSeatsDialog = false" class="text-sm">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogDescription>Yakin ingin menghapus kendaraan ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showDeleteDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmDelete">Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Regenerate Confirmation Dialog -->
    <Dialog v-model:open="showRegenerateDialog">
      <DialogContent>
        <DialogTitle>Konfirmasi Regenerate</DialogTitle>
        <DialogDescription>Yakin ingin regenerate kursi? Data kursi lama akan dihapus dan diganti dengan yang baru.</DialogDescription>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showRegenerateDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmRegenerate">Regenerate</Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const loadingSeats = ref(false)
const submitting = ref(false)
const vehicles = ref<any[]>([])
const partners = ref<any[]>([])
const seats = ref<any[]>([])

const showVehicleDialog = ref(false)
const showSeatsDialog = ref(false)
const showDeleteDialog = ref(false)
const showRegenerateDialog = ref(false)
const isEdit = ref(false)
const selectedVehicle = ref<any>(null)
const vehicleToDelete = ref<number | null>(null)

const vehicleForm = ref({
  name: '',
  plate_number: '',
  partner_id: '',
  seat_capacity: 40,
  seat_layout: '2-2'
})

const seatsByRow = computed(() => {
  if (!seats.value.length) return null
  const grouped: Record<number, any[]> = {}
  seats.value.forEach(seat => {
    if (!grouped[seat.row]) grouped[seat.row] = []
    grouped[seat.row].push(seat)
  })
  // Sort by column within each row
  Object.keys(grouped).forEach(row => {
    grouped[Number(row)].sort((a, b) => a.column - b.column)
  })
  return grouped
})

onMounted(() => {
  fetchVehicles()
  fetchPartners()
})

const fetchVehicles = async () => {
  loading.value = true
  try {
    const response = await api.get('/vehicles')
    vehicles.value = response.data.data || []
  } catch {
    toast({ title: 'Gagal memuat data kendaraan', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const fetchPartners = async () => {
  try {
    const response = await api.get('/mitra')
    partners.value = response.data.data || []
  } catch {
    toast({ title: 'Gagal memuat data partner', variant: 'destructive' })
  }
}

const fetchSeats = async (vehicleId: number) => {
  loadingSeats.value = true
  try {
    const response = await api.get(`/seats?vehicle_id=${vehicleId}`)
    seats.value = response.data.data || []
    if (seats.value.length === 0) {
      toast({ title: 'Info', description: 'Belum ada kursi yang di-generate untuk kendaraan ini' })
    }
  } catch (error) {
    console.error('Failed to fetch seats:', error)
    toast({ title: 'Error', description: 'Gagal memuat data kursi', variant: 'destructive' })
    seats.value = []
  } finally {
    loadingSeats.value = false
  }
}

const openVehicleDialog = () => {
  isEdit.value = false
  vehicleForm.value = { name: '', plate_number: '', partner_id: '', seat_capacity: 40, seat_layout: '2-2' }
  showVehicleDialog.value = true
}

const editVehicle = (vehicle: any) => {
  isEdit.value = true
  vehicleForm.value = {
    name: vehicle.name,
    plate_number: vehicle.plate_number,
    partner_id: vehicle.partner_id,
    seat_capacity: vehicle.seat_capacity,
    seat_layout: vehicle.seat_layout
  }
  selectedVehicle.value = vehicle
  showVehicleDialog.value = true
}

const submitVehicle = async () => {
  // Validasi form
  if (!vehicleForm.value.name || !vehicleForm.value.plate_number || !vehicleForm.value.seat_capacity) {
    toast({ title: 'Nama, plat nomor, dan kapasitas kursi harus diisi', variant: 'destructive' })
    return
  }
  if (vehicleForm.value.seat_capacity < 1 || vehicleForm.value.seat_capacity > 100) {
    toast({ title: 'Kapasitas kursi harus antara 1-100', variant: 'destructive' })
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await api.put(`/vehicles/${selectedVehicle.value.id}`, vehicleForm.value)
      toast({ title: 'Berhasil', description: 'Kendaraan berhasil diperbarui' })
    } else {
      await api.post('/vehicles', vehicleForm.value)
      toast({ title: 'Berhasil', description: 'Kendaraan berhasil ditambahkan' })
    }
    showVehicleDialog.value = false
    fetchVehicles()
  } catch (error: any) {
    toast({ title: error.response?.data?.message || 'Gagal menyimpan kendaraan', variant: 'destructive' })
  } finally {
    submitting.value = false
  }
}

const deleteVehicle = (id: number) => {
  showDeleteDialog.value = true
  vehicleToDelete.value = id
}

const confirmDelete = async () => {
  if (!vehicleToDelete.value) return
  try {
    await api.delete(`/vehicles/${vehicleToDelete.value}`)
    toast({ title: 'Berhasil', description: 'Kendaraan berhasil dihapus' })
    fetchVehicles()
  } catch (error: any) {
    toast({ title: error.response?.data?.message || 'Gagal menghapus kendaraan', variant: 'destructive' })
  } finally {
    showDeleteDialog.value = false
    vehicleToDelete.value = null
  }
}

const viewSeats = (vehicle: any) => {
  selectedVehicle.value = vehicle
  showSeatsDialog.value = true
  fetchSeats(vehicle.id)
}

const generateSeats = async (vehicle: any) => {
  try {
    await api.post('/seats/generate', {
      vehicle_id: vehicle.id,
      seat_capacity: vehicle.seat_capacity,
      seat_layout: vehicle.seat_layout
    })
    toast({ title: 'Berhasil', description: `${vehicle.seat_capacity} kursi berhasil di-generate` })
    fetchVehicles()
    if (showSeatsDialog.value && selectedVehicle.value?.id === vehicle.id) fetchSeats(vehicle.id)
  } catch (error: any) {
    toast({ title: error.response?.data?.message || 'Gagal generate kursi', variant: 'destructive' })
  }
}

const regenerateSeats = () => {
  if (!selectedVehicle.value) return
  showRegenerateDialog.value = true
}

const confirmRegenerate = async () => {
  if (!selectedVehicle.value) return
  showRegenerateDialog.value = false
  await generateSeats(selectedVehicle.value)
}
</script>