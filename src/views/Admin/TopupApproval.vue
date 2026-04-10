<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Approval Top Up</h1>
            <p class="text-muted-foreground mt-1">Kelola permintaan top up dari mitra</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Top Up</CardTitle>
              <CardDescription>Permintaan top up yang perlu disetujui</CardDescription>
            </CardHeader>
            <CardContent>
              <!-- Filter Bar -->
              <div class="flex flex-wrap gap-2 mb-4">
                <select v-model="filterMitra" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Semua Mitra</option>
                  <option v-for="name in mitraOptions" :key="name" :value="name">{{ name }}</option>
                </select>
                <select v-model="filterStatus" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select v-model="filterYear" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Semua Tahun</option>
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
                <select v-model="filterMonth" class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
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
                <Button variant="outline" size="sm" class="h-9" @click="resetFilters">Reset</Button>
              </div>
              <div v-if="loading" class="text-center py-8">Loading...</div>
              <div v-else-if="filteredTopups.length === 0" class="text-center py-8 text-muted-foreground">
                Tidak ada data top up
              </div>
              <Table v-else>
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
                    <TableCell class="font-medium">{{ topup.id }}</TableCell>
                    <TableCell>{{ topup.mitra?.name || '-' }}</TableCell>
                    <TableCell>{{ formatCurrency(topup.amount) }}</TableCell>
                    <TableCell>
                      <Badge :class="getStatusClass(topup.status)">
                        {{ topup.status }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ formatDateTime(topup.created_at) }}</TableCell>
                    <TableCell class="text-right">
                      <div class="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" @click="viewDetail(topup)">
                          Detail
                        </Button>
                        <div v-if="topup.status === 'pending'" class="flex gap-2">
                          <Button size="sm" @click="approveTopup(topup.id)">
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" @click="openRejectDialog(topup)">
                            Reject
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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

          <div v-if="selectedTopup.proof_of_payment" class="space-y-2">
            <Label class="text-muted-foreground">Bukti Transfer</Label>
            <img :src="selectedTopup.proof_of_payment" alt="Bukti Transfer" class="w-full max-h-96 object-contain border rounded-lg" />
          </div>

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
import { onMounted, ref, computed } from 'vue'
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

// Filter state
const filterMitra = ref('')
const filterStatus = ref('')
const filterYear = ref('')
const filterMonth = ref('')

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
}

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

const fetchTopups = async () => {
  loading.value = true
  try {
    const response = await api.get('/topups')
    const data = response.data.message?.data || response.data.data?.data || response.data.data || []
    topups.value = Array.isArray(data) ? data : []
  } catch {
    toast({ title: 'Gagal memuat data top up', variant: 'destructive' })
    topups.value = []
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
</script>
