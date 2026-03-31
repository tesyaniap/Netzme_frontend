<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Manajemen Lokasi</h1>
            <p class="text-muted-foreground mt-1">Kelola kota, terminal, dan rute</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button 
            @click="activeTab = 'cities'"
            :class="['px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'cities' ? 'bg-background shadow-sm' : 'hover:bg-background/50']"
          >
            Kota
          </button>
          <button 
            @click="activeTab = 'terminals'"
            :class="['px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'terminals' ? 'bg-background shadow-sm' : 'hover:bg-background/50']"
          >
            Terminal
          </button>
          <button 
            @click="activeTab = 'routes'"
            :class="['px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'routes' ? 'bg-background shadow-sm' : 'hover:bg-background/50']"
          >
            Rute
          </button>
        </div>

        <!-- Cities Tab -->
        <Card v-show="activeTab === 'cities'">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Kota</CardTitle>
                <CardDescription>{{ cities.length }} kota terdaftar</CardDescription>
              </div>
              <Button @click="openCityDialog">
                <Plus class="mr-2 h-4 w-4" />
                Tambah Kota
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loadingCities" class="text-center py-8">Loading...</div>
            <div v-else-if="cities.length === 0" class="text-center py-8 text-muted-foreground">
              Belum ada kota
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kota</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Provinsi</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="city in cities" :key="city.id">
                  <TableCell class="font-medium">{{ city.name }}</TableCell>
                  <TableCell>{{ city.code }}</TableCell>
                  <TableCell>{{ city.province || '-' }}</TableCell>
                  <TableCell>{{ city.terminals_count || 0 }} terminal</TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" @click="editCity(city)">Edit</Button>
                      <Button size="sm" variant="destructive" @click="deleteCity(city.id)">Hapus</Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <!-- Terminals Tab -->
        <Card v-show="activeTab === 'terminals'">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Terminal</CardTitle>
                <CardDescription>{{ terminals.length }} terminal terdaftar</CardDescription>
              </div>
              <Button @click="openTerminalDialog">
                <Plus class="mr-2 h-4 w-4" />
                Tambah Terminal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loadingTerminals" class="text-center py-8">Loading...</div>
            <div v-else-if="terminals.length === 0" class="text-center py-8 text-muted-foreground">
              Belum ada terminal
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Terminal</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="terminal in terminals" :key="terminal.id">
                  <TableCell class="font-medium">{{ terminal.name }}</TableCell>
                  <TableCell>{{ terminal.city?.name || '-' }}</TableCell>
                  <TableCell>{{ terminal.address || '-' }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ terminal.type || 'Terminal' }}</Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" @click="editTerminal(terminal)">Edit</Button>
                      <Button size="sm" variant="destructive" @click="deleteTerminal(terminal.id)">Hapus</Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <!-- Routes Tab -->
        <Card v-show="activeTab === 'routes'">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Rute</CardTitle>
                <CardDescription>{{ routes.length }} rute terdaftar</CardDescription>
              </div>
              <Button @click="openRouteDialog">
                <Plus class="mr-2 h-4 w-4" />
                Tambah Rute
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loadingRoutes" class="text-center py-8">Loading...</div>
            <div v-else-if="routes.length === 0" class="text-center py-8 text-muted-foreground">
              Belum ada rute
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Rute</TableHead>
                  <TableHead>Terminal Asal</TableHead>
                  <TableHead>Terminal Tujuan</TableHead>
                  <TableHead>Jarak (KM)</TableHead>
                  <TableHead>Estimasi Waktu</TableHead>
                  <TableHead class="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="route in routes" :key="route.id">
                  <TableCell class="font-medium">
                    {{ route.origin_city?.name }} - {{ route.destination_city?.name }}
                  </TableCell>
                  <TableCell>{{ route.origin_terminal?.name || '-' }}</TableCell>
                  <TableCell>{{ route.destination_terminal?.name || '-' }}</TableCell>
                  <TableCell>{{ route.distance || '-' }} KM</TableCell>
                  <TableCell>{{ route.duration || '-' }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" @click="editRoute(route)">Edit</Button>
                      <Button size="sm" variant="destructive" @click="deleteRoute(route.id)">Hapus</Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>

    <!-- City Dialog -->
    <Dialog v-model:open="showCityDialog">
      <DialogContent>
        <DialogTitle>{{ isEditCity ? 'Edit' : 'Tambah' }} Kota</DialogTitle>
        <DialogDescription>{{ isEditCity ? 'Ubah' : 'Tambahkan' }} data kota</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Nama Kota</Label>
            <Input v-model="cityForm.name" placeholder="Contoh: Jakarta" />
          </div>
          <div class="space-y-2">
            <Label>Kode Kota</Label>
            <Input v-model="cityForm.code" placeholder="Contoh: JKT" />
          </div>
          <div class="space-y-2">
            <Label>Provinsi</Label>
            <Input v-model="cityForm.province" placeholder="Contoh: DKI Jakarta" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showCityDialog = false">Batal</Button>
          <Button @click="submitCity" :disabled="submittingCity">
            {{ submittingCity ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Route Dialog -->
    <Dialog v-model:open="showRouteDialog">
      <DialogContent class="max-w-2xl">
        <DialogTitle>{{ isEditRoute ? 'Edit' : 'Tambah' }} Rute</DialogTitle>
        <DialogDescription>{{ isEditRoute ? 'Ubah' : 'Tambahkan' }} data rute perjalanan</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Kota Asal</Label>
              <select v-model="routeForm.origin_city_id" @change="onOriginCityChange" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Kota Asal</option>
                <option v-for="city in cities" :key="city.id" :value="city.id">
                  {{ city.name }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>Kota Tujuan</Label>
              <select v-model="routeForm.destination_city_id" @change="onDestinationCityChange" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Kota Tujuan</option>
                <option v-for="city in cities" :key="city.id" :value="city.id">
                  {{ city.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Terminal Asal</Label>
              <select v-model="routeForm.origin_terminal_id" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Terminal Asal</option>
                <option v-for="terminal in originTerminals" :key="terminal.id" :value="terminal.id">
                  {{ terminal.name }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <Label>Terminal Tujuan</Label>
              <select v-model="routeForm.destination_terminal_id" class="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Pilih Terminal Tujuan</option>
                <option v-for="terminal in destinationTerminals" :key="terminal.id" :value="terminal.id">
                  {{ terminal.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Jarak (KM)</Label>
              <Input v-model="routeForm.distance" type="number" placeholder="Contoh: 150" />
            </div>
            <div class="space-y-2">
              <Label>Estimasi Waktu</Label>
              <Input v-model="routeForm.duration" placeholder="Contoh: 3 jam 30 menit" />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showRouteDialog = false">Batal</Button>
          <Button @click="submitRoute" :disabled="submittingRoute">
            {{ submittingRoute ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="showTerminalDialog">
      <DialogContent>
        <DialogTitle>{{ isEditTerminal ? 'Edit' : 'Tambah' }} Terminal</DialogTitle>
        <DialogDescription>{{ isEditTerminal ? 'Ubah' : 'Tambahkan' }} data terminal</DialogDescription>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Nama Terminal</Label>
            <Input v-model="terminalForm.name" placeholder="Contoh: Terminal Kampung Rambutan" />
          </div>
          <div class="space-y-2">
            <Label>Kota</Label>
            <select v-model="terminalForm.city_id" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Kota</option>
              <option v-for="city in cities" :key="city.id" :value="city.id">
                {{ city.name }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Alamat</Label>
            <Input v-model="terminalForm.address" placeholder="Alamat lengkap terminal" />
          </div>
          <div class="space-y-2">
            <Label>Tipe Terminal</Label>
            <select v-model="terminalForm.type" class="w-full rounded-md border px-3 py-2 text-sm">
              <option value="">Pilih Tipe</option>
              <option value="Terminal">Terminal</option>
              <option value="Pool">Pool</option>
              <option value="Agen">Agen</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showTerminalDialog = false">Batal</Button>
          <Button @click="submitTerminal" :disabled="submittingTerminal">
            {{ submittingTerminal ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete City Confirmation -->
    <Dialog v-model:open="showDeleteCityDialog">
      <DialogContent>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogDescription>Yakin ingin menghapus kota ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showDeleteCityDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmDeleteCity">Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Route Confirmation -->
    <Dialog v-model:open="showDeleteRouteDialog">
      <DialogContent>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogDescription>Yakin ingin menghapus rute ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showDeleteRouteDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmDeleteRoute">Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="showDeleteTerminalDialog">
      <DialogContent>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogDescription>Yakin ingin menghapus terminal ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showDeleteTerminalDialog = false">Batal</Button>
          <Button variant="destructive" @click="confirmDeleteTerminal">Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

const activeTab = ref('cities')
const loadingCities = ref(false)
const loadingTerminals = ref(false)
const loadingRoutes = ref(false)
const submittingCity = ref(false)
const submittingTerminal = ref(false)
const submittingRoute = ref(false)

const cities = ref<any[]>([])
const terminals = ref<any[]>([])
const routes = ref<any[]>([])

const showCityDialog = ref(false)
const showTerminalDialog = ref(false)
const showRouteDialog = ref(false)
const showDeleteCityDialog = ref(false)
const showDeleteTerminalDialog = ref(false)
const showDeleteRouteDialog = ref(false)

const isEditCity = ref(false)
const isEditTerminal = ref(false)
const isEditRoute = ref(false)
const selectedCity = ref<any>(null)
const selectedTerminal = ref<any>(null)
const selectedRoute = ref<any>(null)
const cityToDelete = ref<number | null>(null)
const terminalToDelete = ref<number | null>(null)
const routeToDelete = ref<number | null>(null)

const cityForm = ref({
  name: '',
  code: '',
  province: ''
})

const terminalForm = ref({
  name: '',
  city_id: '',
  address: '',
  type: ''
})

const routeForm = ref({
  origin_city_id: '',
  destination_city_id: '',
  origin_terminal_id: '',
  destination_terminal_id: '',
  distance: '',
  duration: ''
})

// Computed properties for filtered terminals
const originTerminals = computed(() => {
  if (!routeForm.value.origin_city_id) return []
  return terminals.value.filter(t => t.city_id == routeForm.value.origin_city_id)
})

const destinationTerminals = computed(() => {
  if (!routeForm.value.destination_city_id) return []
  return terminals.value.filter(t => t.city_id == routeForm.value.destination_city_id)
})

onMounted(() => {
  fetchCities()
  fetchTerminals()
  fetchRoutes()
})

const fetchCities = async () => {
  loadingCities.value = true
  try {
    const response = await api.get('/cities')
    cities.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch cities:', error)
    toast({ title: 'Error', description: 'Gagal memuat data kota', variant: 'destructive' })
  } finally {
    loadingCities.value = false
  }
}

const fetchTerminals = async () => {
  loadingTerminals.value = true
  try {
    const response = await api.get('/terminals')
    terminals.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch terminals:', error)
    toast({ title: 'Error', description: 'Gagal memuat data terminal', variant: 'destructive' })
  } finally {
    loadingTerminals.value = false
  }
}

const fetchRoutes = async () => {
  loadingRoutes.value = true
  try {
    const response = await api.get('/routes')
    routes.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch routes:', error)
    toast({ title: 'Error', description: 'Gagal memuat data rute', variant: 'destructive' })
  } finally {
    loadingRoutes.value = false
  }
}

const openRouteDialog = () => {
  isEditRoute.value = false
  routeForm.value = {
    origin_city_id: '',
    destination_city_id: '',
    origin_terminal_id: '',
    destination_terminal_id: '',
    distance: '',
    duration: ''
  }
  showRouteDialog.value = true
}

const editRoute = (route: any) => {
  isEditRoute.value = true
  routeForm.value = {
    origin_city_id: route.origin_city_id,
    destination_city_id: route.destination_city_id,
    origin_terminal_id: route.origin_terminal_id || '',
    destination_terminal_id: route.destination_terminal_id || '',
    distance: route.distance || '',
    duration: route.duration || ''
  }
  selectedRoute.value = route
  showRouteDialog.value = true
}

const submitRoute = async () => {
  submittingRoute.value = true
  try {
    if (isEditRoute.value) {
      await api.put(`/routes/${selectedRoute.value.id}`, routeForm.value)
      toast({ title: 'Berhasil', description: 'Rute berhasil diupdate' })
    } else {
      await api.post('/routes', routeForm.value)
      toast({ title: 'Berhasil', description: 'Rute berhasil ditambahkan' })
    }
    showRouteDialog.value = false
    fetchRoutes()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menyimpan rute', variant: 'destructive' })
  } finally {
    submittingRoute.value = false
  }
}

const deleteRoute = (id: number) => {
  showDeleteRouteDialog.value = true
  routeToDelete.value = id
}

const confirmDeleteRoute = async () => {
  if (!routeToDelete.value) return
  try {
    await api.delete(`/routes/${routeToDelete.value}`)
    toast({ title: 'Berhasil', description: 'Rute berhasil dihapus' })
    fetchRoutes()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menghapus rute', variant: 'destructive' })
  } finally {
    showDeleteRouteDialog.value = false
    routeToDelete.value = null
  }
}

const onOriginCityChange = () => {
  routeForm.value.origin_terminal_id = ''
}

const onDestinationCityChange = () => {
  routeForm.value.destination_terminal_id = ''
}

const openCityDialog = () => {
  isEditCity.value = false
  cityForm.value = {
    name: '',
    code: '',
    province: ''
  }
  showCityDialog.value = true
}

const editCity = (city: any) => {
  isEditCity.value = true
  cityForm.value = {
    name: city.name,
    code: city.code,
    province: city.province || ''
  }
  selectedCity.value = city
  showCityDialog.value = true
}

const submitCity = async () => {
  submittingCity.value = true
  try {
    if (isEditCity.value) {
      await api.put(`/cities/${selectedCity.value.id}`, cityForm.value)
      toast({ title: 'Berhasil', description: 'Kota berhasil diupdate' })
    } else {
      await api.post('/cities', cityForm.value)
      toast({ title: 'Berhasil', description: 'Kota berhasil ditambahkan' })
    }
    showCityDialog.value = false
    fetchCities()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menyimpan kota', variant: 'destructive' })
  } finally {
    submittingCity.value = false
  }
}

const deleteCity = (id: number) => {
  showDeleteCityDialog.value = true
  cityToDelete.value = id
}

const confirmDeleteCity = async () => {
  if (!cityToDelete.value) return
  try {
    await api.delete(`/cities/${cityToDelete.value}`)
    toast({ title: 'Berhasil', description: 'Kota berhasil dihapus' })
    fetchCities()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menghapus kota', variant: 'destructive' })
  } finally {
    showDeleteCityDialog.value = false
    cityToDelete.value = null
  }
}

const openTerminalDialog = () => {
  isEditTerminal.value = false
  terminalForm.value = {
    name: '',
    city_id: '',
    address: '',
    type: ''
  }
  showTerminalDialog.value = true
}

const editTerminal = (terminal: any) => {
  isEditTerminal.value = true
  terminalForm.value = {
    name: terminal.name,
    city_id: terminal.city_id,
    address: terminal.address || '',
    type: terminal.type || ''
  }
  selectedTerminal.value = terminal
  showTerminalDialog.value = true
}

const submitTerminal = async () => {
  submittingTerminal.value = true
  try {
    if (isEditTerminal.value) {
      await api.put(`/terminals/${selectedTerminal.value.id}`, terminalForm.value)
      toast({ title: 'Berhasil', description: 'Terminal berhasil diupdate' })
    } else {
      await api.post('/terminals', terminalForm.value)
      toast({ title: 'Berhasil', description: 'Terminal berhasil ditambahkan' })
    }
    showTerminalDialog.value = false
    fetchTerminals()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menyimpan terminal', variant: 'destructive' })
  } finally {
    submittingTerminal.value = false
  }
}

const deleteTerminal = (id: number) => {
  showDeleteTerminalDialog.value = true
  terminalToDelete.value = id
}

const confirmDeleteTerminal = async () => {
  if (!terminalToDelete.value) return
  try {
    await api.delete(`/terminals/${terminalToDelete.value}`)
    toast({ title: 'Berhasil', description: 'Terminal berhasil dihapus' })
    fetchTerminals()
  } catch (error: any) {
    toast({ title: 'Error', description: error.response?.data?.message || 'Gagal menghapus terminal', variant: 'destructive' })
  } finally {
    showDeleteTerminalDialog.value = false
    terminalToDelete.value = null
  }
}
</script>