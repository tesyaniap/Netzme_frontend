<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Mitra</h1>
            <p class="text-muted-foreground mt-1 text-sm sm:text-base">Kelola data mitra dan partner</p>
          </div>
          <Button @click="$router.push('/admin/mitra/add')" class="w-full sm:w-auto">
            <Plus class="mr-2 h-4 w-4" />
            Tambah Mitra
          </Button>
        </div>

        <!-- Pending Approval Table -->
        <Card>
          <CardHeader>
            <CardTitle>Mitra Menunggu Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="pendingMitras.length === 0" class="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
              Tidak ada mitra yang menunggu approval
            </div>
            <div v-else class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="min-w-[120px]">Nama Mitra</TableHead>
                    <TableHead class="min-w-[150px]">Email</TableHead>
                    <TableHead class="min-w-[100px]">Telepon</TableHead>
                    <TableHead class="min-w-[120px]">Tanggal Daftar</TableHead>
                    <TableHead class="text-right min-w-[200px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="mitra in pendingMitras" :key="mitra.id">
                    <TableCell class="font-medium text-sm">{{ mitra.nama }}</TableCell>
                    <TableCell class="text-sm">{{ mitra.email }}</TableCell>
                    <TableCell class="text-sm">{{ mitra.phone || '-' }}</TableCell>
                    <TableCell class="text-sm">{{ formatDate(mitra.tanggal_bergabung) }}</TableCell>
                    <TableCell class="text-right">
                      <div class="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                        <Button variant="ghost" size="sm" @click="viewDetail(mitra.id)" class="text-xs">Detail</Button>
                        <Button variant="default" size="sm" @click="approveMitra(mitra.id)" class="text-xs">Setujui</Button>
                        <Button variant="destructive" size="sm" @click="rejectMitra(mitra.id)" class="text-xs">Tolak</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <!-- Active/Rejected Table -->
        <Card>
          <CardHeader>
            <CardTitle>Daftar Mitra</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
              <div class="flex-1">
                <Input v-model="searchQuery" placeholder="Cari nama atau email..." @input="handleSearch" class="text-sm" />
              </div>
              <Select v-model="statusFilter" @update:model-value="handleStatusFilter">
                <SelectTrigger class="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="loading" class="text-center py-6 sm:py-8 text-sm">Loading...</div>
            <div v-else-if="activeMitras.length === 0" class="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
              Tidak ada data mitra
            </div>
            <div v-else class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="min-w-[120px]">Nama Mitra</TableHead>
                    <TableHead class="min-w-[150px]">Email</TableHead>
                    <TableHead class="min-w-[120px]">Saldo Deposit</TableHead>
                    <TableHead class="min-w-[80px]">Status</TableHead>
                    <TableHead class="min-w-[120px]">Tanggal Bergabung</TableHead>
                    <TableHead class="text-right min-w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="mitra in activeMitras" :key="mitra.id">
                    <TableCell class="font-medium text-sm">{{ mitra.nama }}</TableCell>
                    <TableCell class="text-sm">{{ mitra.email }}</TableCell>
                    <TableCell class="text-sm">{{ formatCurrency(mitra.saldo_deposit) }}</TableCell>
                    <TableCell>
                      <Badge :variant="mitra.status === 'active' ? 'default' : 'destructive'" class="text-xs">
                        {{ mitra.status }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-sm">{{ formatDate(mitra.tanggal_bergabung) }}</TableCell>
                    <TableCell class="text-right">
                      <Button variant="ghost" size="sm" @click="viewDetail(mitra.id)" class="text-xs">Detail</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>

    <!-- Detail Dialog -->
    <Dialog v-model:open="detailDialogOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div class="space-y-4">
          <div>
            <DialogTitle class="text-lg sm:text-xl">Detail Mitra</DialogTitle>
            <DialogDescription class="text-sm">Informasi lengkap mitra</DialogDescription>
          </div>
          
          <div v-if="loadingDetail" class="text-center py-6 sm:py-8 text-sm">Loading...</div>
          
          <div v-else-if="selectedMitra" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p class="text-xs sm:text-sm text-muted-foreground">Kode Mitra</p>
                <p class="font-medium text-sm sm:text-base">{{ selectedMitra.code }}</p>
              </div>
              <div>
                <p class="text-xs sm:text-sm text-muted-foreground">Status</p>
                <Badge :variant="selectedMitra.status === 'active' ? 'default' : selectedMitra.status === 'pending' ? 'secondary' : 'destructive'" class="text-xs">
                  {{ selectedMitra.status }}
                </Badge>
              </div>
              <div>
                <p class="text-xs sm:text-sm text-muted-foreground">Nama</p>
                <p class="font-medium text-sm sm:text-base">{{ selectedMitra.name }}</p>
              </div>
              <div>
                <p class="text-xs sm:text-sm text-muted-foreground">Email</p>
                <p class="font-medium text-sm sm:text-base break-all">{{ selectedMitra.email }}</p>
              </div>
              <div>
                <p class="text-xs sm:text-sm text-muted-foreground">Telepon</p>
                <p class="font-medium text-sm sm:text-base">{{ selectedMitra.phone }}</p>
              </div>
              <div>
                <p class="text-xs sm:text-sm text-muted-foreground">Saldo Deposit</p>
                <p class="font-medium text-sm sm:text-base">{{ formatCurrency(selectedMitra.balance) }}</p>
              </div>
              <div class="sm:col-span-2">
                <p class="text-xs sm:text-sm text-muted-foreground">Tanggal Bergabung</p>
                <p class="font-medium text-sm sm:text-base">{{ formatDate(selectedMitra.created_at) }}</p>
              </div>
            </div>
            
            <div class="flex justify-end pt-4">
              <Button variant="outline" @click="detailDialogOpen = false" class="text-sm">Tutup</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { Plus } from 'lucide-vue-next'
import { api } from '@/services/api.service'
import { mitraService } from '@/services/mitra.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()
const router = useRouter()

const loading = ref(false)
const allMitras = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')
const detailDialogOpen = ref(false)
const loadingDetail = ref(false)
const selectedMitra = ref<any>(null)

onMounted(() => {
  fetchMitras()
})

const fetchMitras = async () => {
  loading.value = true
  try {
    const response = await api.get('/mitra')
    const data = response.data.data
    allMitras.value = Array.isArray(data) ? data : []
  } catch {
    toast({ title: 'Gagal memuat data mitra', variant: 'destructive' })
    allMitras.value = []
  } finally {
    loading.value = false
  }
}

const pendingMitras = computed(() => {
  if (!Array.isArray(allMitras.value)) return []
  return allMitras.value
    .filter(m => m.status === 'pending')
    .map(m => ({
      id: m.id,
      nama: m.name,
      email: m.email,
      phone: m.phone,
      saldo_deposit: m.balance,
      status: m.status,
      tanggal_bergabung: m.created_at
    }))
})

const activeMitras = computed(() => {
  if (!Array.isArray(allMitras.value)) return []
  let filtered = allMitras.value.filter(m => m.status !== 'pending')
  
  if (searchQuery.value) {
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(m => m.status === statusFilter.value)
  }
  
  return filtered.map(m => ({
    id: m.id,
    nama: m.name,
    email: m.email,
    saldo_deposit: m.balance,
    status: m.status,
    tanggal_bergabung: m.created_at
  }))
})

const handleSearch = () => {}

const handleStatusFilter = () => {}

const viewDetail = async (id: number) => {
  detailDialogOpen.value = true
  loadingDetail.value = true
  try {
    const response = await mitraService.getMitraDetail(id)
    selectedMitra.value = response.data
  } catch {
    toast({ title: 'Gagal memuat detail mitra', variant: 'destructive' })
  } finally {
    loadingDetail.value = false
  }
}

const approveMitra = async (id: number) => {
  try {
    await api.post(`/mitra/${id}/approve`)
    toast({ title: 'Berhasil', description: 'Mitra berhasil disetujui' })
    fetchMitras()
  } catch {
    toast({ title: 'Gagal menyetujui mitra', variant: 'destructive' })
  }
}

const rejectMitra = async (id: number) => {
  try {
    await api.post(`/mitra/${id}/reject`)
    toast({ title: 'Berhasil', description: 'Mitra berhasil ditolak' })
    fetchMitras()
  } catch {
    toast({ title: 'Gagal menolak mitra', variant: 'destructive' })
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>
