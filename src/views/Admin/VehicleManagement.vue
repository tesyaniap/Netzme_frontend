<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Manajemen Kendaraan</h1>
            <p class="text-muted-foreground mt-1">Kelola kendaraan dan kursi bus</p>
          </div>
          <Button @click="openVehicleDialog">
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
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="vehicles.length === 0" class="text-center py-8 text-muted-foreground">
              Belum ada kendaraan
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kendaraan</TableHead>
                  <TableHead>Nomor Plat</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Kapasitas</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Kursi</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="vehicle in vehicles" :key="vehicle.id">
                  <TableCell class="font-medium">{{ vehicle.name }}</TableCell>
                  <TableCell>{{ vehicle.plate_number }}</TableCell>
                  <TableCell>{{ vehicle.partner?.name || '-' }}</TableCell>
                  <TableCell>{{ vehicle.seat_capacity }} kursi</TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ vehicle.seat_layout }}</Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <span>{{ vehicle.seats_count || 0 }} kursi</span>
                      <Button 
                        v-if="!vehicle.seats_count" 
                        size="sm" 
                        variant="outline" 
                        @click="generateSeats(vehicle)"
                      >
                        Generate
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" @click="viewSeats(vehicle)">Kursi</Button>
                      <Button size="sm" variant="outline" @click="editVehicle(vehicle)">Edit</Button>
                      <Button size="sm" variant="destructive" @click="deleteVehicle(vehicle.id)">Hapus</Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>

    <!-- Vehicle Dialog -->
    <Dialog v-model:open="showVehicleDialog">
      <DialogContent>
        <DialogTitle>{{ isEdit ? 'Edit' : 'Tambah' }} Kendaraan</DialogTitle>
        <DialogDescription>{{ isEdit ? 'Ubah' : 'Tambahkan' }} data kendaraan</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Nama Kendaraan</Label>
            <Input v-model="vehicleForm.name" placeholder="Contoh: Bus Ekonomi 01" />
          </div>
          <div class="space-y-2">
            <Label>Nomor Plat</Label>
            <Input v-model="vehicleForm.plate_number" placeholder="Contoh: B 1234 ABC" />
          </div>
          <div class="space-y-2">
            <Label>Partner/Mitra</Label>
            <select v-model="vehicleForm.partner_id" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Partner</option>
              <option v-for="partner in partners" :key="partner.id" :value="partner.id">
                {{ partner.name }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Kapasitas Kursi</Label>
            <Input v-model.number="vehicleForm.seat_capacity" type="number" placeholder="40" />
          </div>
          <div class="space-y-2">
            <Label>Layout Kursi</Label>
            <select v-model="vehicleForm.seat_layout" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Layout</option>
              <option value="2-2">2-2 (Ekonomi)</option>
              <option value="2-1">2-1 (Eksekutif)</option>
              <option value="1-2">1-2 (VIP)</option>
              <option value="2-3">2-3 (Super Ekonomi)</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showVehicleDialog = false">Batal</Button>
          <Button @click="submitVehicle" :disabled="submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Seats Dialog -->
    <Dialog v-model:open="showSeatsDialog">
      <DialogContent class="max-w-4xl">
        <DialogTitle>Kursi - {{ selectedVehicle?.name }}</DialogTitle>
        <DialogDescription>Layout kursi kendaraan</DialogDescription>
        
        <div v-if="loadingSeats" class="text-center py-8">Loading...</div>
        <div v-else-if="seats.length === 0" class="text-center py-8">
          <p class="text-muted-foreground mb-4">Belum ada kursi yang di-generate</p>
          <Button @click="generateSeats(selectedVehicle)">Generate Kursi</Button>
        </div>
        <div v-else class="space-y-4">
          <div class="flex justify-between items-center">
            <p class="text-sm text-muted-foreground">{{ seats.length }} kursi tersedia</p>
            <Button size="sm" variant="outline" @click="regenerateSeats">Regenerate</Button>
          </div>
          
          <!-- Seat Map -->
          <div class="border rounded-lg p-4 bg-gray-50">
            <div class="text-center mb-4 text-sm font-medium">DEPAN BUS</div>
            <div v-if="seatsByRow" class="space-y-2">
              <div v-for="(rowSeats, row) in seatsByRow" :key="row" class="flex justify-center gap-2">
                <div v-for="seat in rowSeats" :key="seat.id" class="w-12 h-10 border rounded flex items-center justify-center text-xs font-medium bg-white">
                  {{ seat.seat_number }}
                </div>
              </div>
            </div>
            <div class="text-center mt-4 text-sm font-medium">BELAKANG BUS</div>
          </div>
        </div>

        <div class="flex justify-end">
          <Button variant="outline" @click="showSeatsDialog = false">Tutup</Button>
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
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
    toast({ title: 'Error', description: 'Gagal memuat data kendaraan', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const fetchPartners = async () => {
  try {
    const response = await api.get('/mitra')
    partners.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch partners:', error)
  }
}

const fetchSeats = async (vehicleId: number) => {
  loadingSeats.value = true
  try {
    const response = await api.get(`/seats?vehicle_id=${vehicleId}`)
    seats.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch seats:', error)
    seats.value = []
  } finally {
    loadingSeats.value = false
  }
}

const openVehicleDialog = () => {
  isEdit.value = false
  vehicleForm.value = {
    name: '',
    plate_number: '',
    partner_id: '',
    seat_capacity: 40,
    seat_layout: '2-2'
  }
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
  submitting.value = true
  try {
    if (isEdit.value) {
      await api.put(`/vehicles/${selectedVehicle.value.id}`, vehicleForm.value)
      toast({ title: 'Berhasil', description: 'Kendaraan berhasil diupdate' })
    } else {
      await api.post('/vehicles', vehicleForm.value)
      toast({ title: 'Berhasil', description: 'Kendaraan berhasil ditambahkan' })
    }
    showVehicleDialog.value = false
    fetchVehicles()
  } catch (error: any) {
    toast({ title: 'Error', description: error.message || 'Gagal menyimpan kendaraan', variant: 'destructive' })
  } finally {
    submitting.value = false
  }
}

const deleteVehicle = async (id: number) => {
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
    toast({ title: 'Error', description: error.message || 'Gagal menghapus kendaraan', variant: 'destructive' })
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
    toast({ title: 'Berhasil', description: 'Kursi berhasil di-generate' })
    fetchVehicles()
    if (showSeatsDialog.value && selectedVehicle.value?.id === vehicle.id) {
      fetchSeats(vehicle.id)
    }
  } catch (error: any) {
    toast({ title: 'Error', description: error.message || 'Gagal generate kursi', variant: 'destructive' })
  }
}

const regenerateSeats = async () => {
  if (!selectedVehicle.value) return
  showRegenerateDialog.value = true
}

const confirmRegenerate = async () => {
  if (!selectedVehicle.value) return
  showRegenerateDialog.value = false
  await generateSeats(selectedVehicle.value)
}
</script>