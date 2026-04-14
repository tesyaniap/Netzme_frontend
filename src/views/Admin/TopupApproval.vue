<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Approval Top Up</h1>
            <p class="text-muted-foreground mt-1 text-sm sm:text-base">Kelola permintaan top up dari mitra</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Top Up</CardTitle>
              <CardDescription>Permintaan top up yang perlu disetujui</CardDescription>
            </CardHeader>
            <CardContent>
              <!-- Filter Bar -->
              <div class="flex flex-wrap gap-2 mb-4">
                <select v-model="filterMitra" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto">
                  <option value="">Semua Mitra</option>
                  <option v-for="name in mitraOptions" :key="name" :value="name">{{ name }}</option>
                </select>
                <select v-model="filterStatus" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto">
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select v-model="filterYear" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto">
                  <option value="">Semua Tahun</option>
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
                <select v-model="filterMonth" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto">
                  <option value="">Semua Bulan</option>
                  <option value="1">Januari</option>
                  <option value="2">Februari</option>
                  <option value="3">Maret</option>
                  <option value="4">April</option>
                  <option value="5">Mei</option>
                  <option value="6">Juni</option>
                  <option value="7">Juli</option>
                  <option value="8">Agustus</option>
                  <option value="9">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
                <Button variant="outline" size="sm" class="h-9 w-full sm:w-auto" @click="resetFilters">Reset</Button>
              </div>
              <div v-if="loading" class="text-center py-8">Loading...</div>
              <div v-else-if="filteredTopups.length === 0" class="text-center py-8 text-muted-foreground">Tidak ada data top up</div>
              <div v-else class="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Top Up</TableHead>
                      <TableHead>Mitra</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead class="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="topup in filteredTopups" :key="topup.id">
                      <TableCell class="font-medium text-sm">{{ topup.id }}</TableCell>
                      <TableCell class="text-sm">{{ topup.mitra?.name || '-' }}</TableCell>
                      <TableCell class="text-sm">{{ formatCurrency(topup.amount) }}</TableCell>
                      <TableCell>
                        <Badge :class="getStatusClass(topup.status)">{{ topup.status }}</Badge>
                      </TableCell>
                      <TableCell class="text-sm">{{ formatDateTime(topup.created_at) }}</TableCell>
                      <TableCell class="text-right">
                        <div class="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                          <Button size="sm" variant="outline" @click="viewDetail(topup)">Detail</Button>
                          <div v-if="topup.status === 'pending'" class="flex gap-1 sm:gap-2">
                            <Button size="sm" @click="approveTopup(topup.id)">Approve</Button>
                            <Button size="sm" variant="destructive" @click="openRejectDialog(topup)">Reject</Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t">
                <p class="text-sm text-muted-foreground">
                  Menampilkan {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, totalTopups) }} dari {{ totalTopups }} data
                </p>
                <div class="flex items-center gap-2">
                  <Button size="sm" variant="outline" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
                    Sebelumnya
                  </Button>
                  <span class="text-sm">{{ currentPage }} / {{ totalPages }}</span>
                  <Button size="sm" variant="outline" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>

    <!-- Detail Topup Dialog -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-2xl">
        <DialogTitle>Detail Top Up</DialogTitle>
        <DialogDescription>Informasi lengkap permintaan top up</DialogDescription>
        <div v-if="selectedTopup" class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-muted-foreground">ID Top Up</Label>
              <p class="font-medium">{{ selectedTopup.id }}</p>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">Status</Label>
              <Badge :class="getStatusClass(selectedTopup.status)">
                {{ selectedTopup.status }}
              </Badge>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">Nama Mitra</Label>
              <p class="font-medium">{{ selectedTopup.mitra?.name || '-' }}</p>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">Email Mitra</Label>
              <p class="font-medium">{{ selectedTopup.mitra?.email || '-' }}</p>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">Nominal Top Up</Label>
              <p class="text-xl font-bold">{{ formatCurrency(selectedTopup.amount) }}</p>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">Metode Pembayaran</Label>
              <p class="font-medium">{{ selectedTopup.payment_method || '-' }}</p>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">Tanggal Permintaan</Label>
              <p class="font-medium">{{ formatDateTime(selectedTopup.created_at) }}</p>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">Terakhir Update</Label>
              <p class="font-medium">{{ formatDateTime(selectedTopup.updated_at) }}</p>
            </div>
          </div>
          
          <div v-if="selectedTopup.status === 'approved'" class="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label class="text-muted-foreground">Diapprove pada</Label>
            <p class="font-medium text-sm">{{ selectedTopup.approved_at ? formatDateTime(selectedTopup.approved_at) : '-' }}</p>
          </div>

          <div v-if="selectedTopup.status === 'rejected' && (selectedTopup.reject_reason || selectedTopup.rejection_reason)" class="space-y-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <Label class="text-destructive">Alasan Penolakan</Label>
            <p class="text-sm text-destructive font-medium">{{ selectedTopup.reject_reason || selectedTopup.rejection_reason }}</p>
          </div>

          <div class="space-y-2 border rounded-lg p-4">
            <div class="flex items-center justify-between">
              <Label class="text-muted-foreground font-medium">Bukti Transfer</Label>
              <template v-if="selectedTopup.proof_file || selectedTopup.proof_file_url">
                <Button size="sm" variant="outline" @click="showProof = !showProof">
                  {{ showProof ? 'Sembunyikan' : 'Lihat Bukti' }}
                </Button>
              </template>
              <span v-else class="text-xs text-muted-foreground italic">Tidak ada file</span>
            </div>
            <div v-if="showProof && (selectedTopup.proof_file || selectedTopup.proof_file_url)" class="mt-2">
              <img
                v-if="isImageFile(selectedTopup.proof_file)"
                :src="selectedTopup.proof_file_url"
                alt="Bukti Transfer"
                class="w-full max-h-[300px] object-contain border rounded-lg bg-muted/30 cursor-zoom-in hover:opacity-90 transition-opacity"
                @click="zoomImage = selectedTopup.proof_file_url"
              />
              <iframe
                v-else-if="isPdfFile(selectedTopup.proof_file)"
                :src="selectedTopup.proof_file_url"
                class="w-full h-[400px] border rounded-lg"
                title="Bukti Transfer PDF"
              />
              <p v-else class="text-sm text-muted-foreground italic">Format file tidak didukung untuk preview</p>
            </div>
          </div>

          <!-- Lightbox -->
          <Teleport to="body">
            <div
              v-if="zoomImage"
              class="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center"
              @click="zoomImage = null"
            >
              <img
                :src="zoomImage"
                class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                @click.stop
              />
              <button
                class="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300"
                @click="zoomImage = null"
              >✕</button>
            </div>
          </Teleport>

          <div v-if="selectedTopup.notes" class="space-y-2">
            <Label class="text-muted-foreground">Catatan</Label>
            <p class="text-sm">{{ selectedTopup.notes }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showDetailDialog = false">Tutup</Button>
          <div v-if="selectedTopup?.status === 'pending'" class="flex gap-2">
            <Button @click="approveTopup(selectedTopup.id)">
              Approve
            </Button>
            <Button variant="destructive" @click="openRejectDialog(selectedTopup)">
              Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Reject Dialog -->
    <Dialog v-model:open="showRejectDialog">
      <DialogContent class="max-w-md">
        <DialogTitle>Tolak Permintaan Top Up</DialogTitle>
        <DialogDescription>Masukkan alasan penolakan untuk dikirim ke mitra</DialogDescription>
        <div class="space-y-3 py-2">
          <div class="p-3 bg-muted/50 rounded-lg text-sm">
            <p class="text-muted-foreground">Mitra</p>
            <p class="font-medium">{{ rejectTarget?.mitra?.name }}</p>
            <p class="text-muted-foreground mt-1">Nominal</p>
            <p class="font-medium">{{ formatCurrency(rejectTarget?.amount) }}</p>
          </div>
          <div class="space-y-1.5">
            <Label>Alasan Penolakan <span class="text-destructive">*</span></Label>
            <textarea
              v-model="rejectReason"
              rows="3"
              placeholder="Contoh: Bukti transfer tidak valid, nominal tidak sesuai..."
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <p v-if="rejectError" class="text-xs text-destructive">{{ rejectError }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" @click="showRejectDialog = false">Batal</Button>
          <Button variant="destructive" :disabled="rejecting" @click="confirmReject">
            {{ rejecting ? 'Menolak...' : 'Tolak Top Up' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()
const loading = ref(false)
const topups = ref<any[]>([])
const showDetailDialog = ref(false)
const selectedTopup = ref<any>(null)
const showProof = ref(false)
const zoomImage = ref<string | null>(null)

// Filter state
const filterMitra = ref('')
const filterStatus = ref('')
const filterYear = ref('')
const filterMonth = ref('')

const route = useRoute()
const router = useRouter()
const currentPage = ref(Number(Array.isArray(route.query.page) ? route.query.page[0] : route.query.page) || 1)
const perPage = ref(10)
const totalTopups = ref(0)
const totalPages = computed(() => Math.ceil(totalTopups.value / perPage.value))

const mitraOptions = computed(() => {
  const names = [...new Set(topups.value.map(t => t.mitra?.name).filter(Boolean))]
  return names.sort()
})

const yearOptions = computed(() => {
  const years = [...new Set(topups.value.map(t => new Date(t.created_at).getFullYear()))]
  return years.sort((a, b) => b - a)
})

const filteredTopups = computed(() => {
  let result = [...topups.value]

  if (filterMitra.value)
    result = result.filter(t => t.mitra?.name === filterMitra.value)

  if (filterStatus.value)
    result = result.filter(t => t.status === filterStatus.value)

  if (filterYear.value)
    result = result.filter(t => new Date(t.created_at).getFullYear() === Number(filterYear.value))

  if (filterMonth.value)
    result = result.filter(t => new Date(t.created_at).getMonth() + 1 === Number(filterMonth.value))

  // pending selalu di atas
  return result.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

const resetFilters = () => {
  filterMitra.value = ''
  filterStatus.value = ''
  filterYear.value = ''
  filterMonth.value = ''
  changePage(1)
}

const syncQueryPage = (page: number) => {
  router.push({ query: { ...route.query, page: String(page) } })
}

watch(() => route.query.page, (newPage) => {
  currentPage.value = Number(Array.isArray(newPage) ? newPage[0] : newPage) || 1
  fetchTopups()
})

// Reject dialog state
const showRejectDialog = ref(false)
const rejectTarget = ref<any>(null)
const rejectReason = ref('')
const rejectError = ref('')
const rejecting = ref(false)

const openRejectDialog = (topup: any) => {
  rejectTarget.value = topup
  rejectReason.value = ''
  rejectError.value = ''
  showDetailDialog.value = false
  showRejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    rejectError.value = 'Alasan penolakan wajib diisi'
    return
  }
  rejecting.value = true
  try {
    const res = await api.post(`/topups/${rejectTarget.value.id}/reject`, { reason: rejectReason.value })
    toast({ title: 'Berhasil', description: 'Top up berhasil ditolak' })
    showRejectDialog.value = false
    await fetchTopups()
    // update selectedTopup jika masih terbuka
    const updated = topups.value.find(t => t.id === rejectTarget.value.id)
    if (updated) selectedTopup.value = updated
  } catch {
    toast({ title: 'Gagal', description: 'Gagal menolak top up', variant: 'destructive' })
  } finally {
    rejecting.value = false
  }
}

onMounted(() => {
  fetchTopups()
})

const changePage = (page: number) => {
  currentPage.value = page
  syncQueryPage(page)
  fetchTopups()
}

const fetchTopups = async () => {
  loading.value = true
  try {
    const response = await api.get('/topups', {
      params: {
        page: currentPage.value,
        limit: perPage.value,
        ...(filterStatus.value && { status: filterStatus.value }),
        ...(filterMitra.value && { mitra: filterMitra.value }),
        ...(filterYear.value && { year: filterYear.value }),
        ...(filterMonth.value && { month: filterMonth.value })
      }
    })

    const data = response.data.message?.data || response.data.data?.data || response.data.data || []
    topups.value = Array.isArray(data) ? data : []
    totalTopups.value = response.data.total ?? response.data.data?.total ?? response.data.message?.total ?? 0
  } catch {
    toast({ title: 'Gagal memuat data top up', variant: 'destructive' })
    topups.value = []
    totalTopups.value = 0
  } finally {
    loading.value = false
  }
}

const approveTopup = async (id: number) => {
  try {
    await api.post(`/topups/${id}/approve`)
    toast({ title: 'Berhasil', description: 'Top up berhasil disetujui' })
    showDetailDialog.value = false
    fetchTopups()
  } catch {
    toast({ title: 'Gagal menyetujui top up', variant: 'destructive' })
  }
}

const rejectTopup = async (id: number) => {
  const topup = topups.value.find(t => t.id === id)
  const rejectingToast = toast({ 
    title: 'Memproses Penolakan...', 
    description: `Sedang reject top up ${formatCurrency(topup?.amount || 0)}`, 
    duration: 0 
  })
  
  try {
    await api.post(`/topups/${id}/reject`)
    rejectingToast.dismiss()
    toast({ title: 'Berhasil', description: `Top up ${formatCurrency(topup?.amount || 0)} berhasil ditolak` })
    showDetailDialog.value = false
    fetchTopups()
  } catch (error) {
    rejectingToast.dismiss()
    toast({ title: 'Gagal', description: 'Gagal menolak top up', variant: 'destructive' })
  }
}

const viewDetail = (topup: any) => {
  selectedTopup.value = topup
  showProof.value = false
  showDetailDialog.value = true
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const formatDateTime = (datetime: string) => {
  return new Date(datetime).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusClass = (status: string) => {
  const s = status?.toLowerCase()
  if (s === 'success' || s === 'approved') return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100'
  if (s === 'pending') return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100'
  if (s === 'rejected') return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-100'
  return 'bg-gray-100 text-gray-700 border-gray-300'
}

const isImageFile = (filename: string) => {
  if (!filename) return false
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
}

const isPdfFile = (filename: string) => {
  if (!filename) return false
  return /\.pdf$/i.test(filename)
}
</script>
