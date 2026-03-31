<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()
const loading = ref(false)
const transactions = ref<any[]>([])
const showCancelDialog = ref(false)
const selectedTransaction = ref<any>(null)
const cancelReason = ref('')
const currentPage = ref(parseInt(route.query.page as string) || 1)
const lastPage = ref(1)
const total = ref(0)

onMounted(() => {
  fetchTransactions(currentPage.value)
})

watch(() => route.query.page, (newPage) => {
  const page = parseInt(newPage as string) || 1
  if (page !== currentPage.value) {
    currentPage.value = page
    fetchTransactions(page)
  }
})

const fetchTransactions = async (page = 1) => {
  loading.value = true
  try {
    console.log('Fetching transactions from API...')
    const response = await api.get(`/reports/transactions?page=${page}&per_page=10`)
    console.log('API Response:', response.data)
    
    if (response.data.status) {
      transactions.value = response.data.data || []
      currentPage.value = response.data.current_page || 1
      lastPage.value = response.data.last_page || 1
      total.value = response.data.total || 0
      console.log('Transactions loaded successfully:', transactions.value.length)
    }
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    toast({
      title: 'Error',
      description: 'Gagal memuat data transaksi',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  router.push({ query: { ...route.query, page: page.toString() } })
  fetchTransactions(page)
}

const openCancelDialog = (transaction: any) => {
  selectedTransaction.value = transaction
  cancelReason.value = ''
  showCancelDialog.value = true
}

const cancelTransaction = async () => {
  if (!selectedTransaction.value) return
  
  if (!cancelReason.value.trim()) {
    toast({
      title: 'Error',
      description: 'Alasan pembatalan wajib diisi',
      variant: 'destructive'
    })
    return
  }

  try {
    await api.post(`/v1/transactions/${selectedTransaction.value.trx_code}/cancel`, {
      reason: cancelReason.value
    })
    
    toast({
      title: 'Berhasil',
      description: 'Transaksi berhasil dibatalkan'
    })
    
    showCancelDialog.value = false
    fetchTransactions(currentPage.value)
  } catch (error: any) {
    console.error('Cancel error:', error)
    toast({
      title: 'Gagal',
      description: error.response?.data?.message || 'Gagal membatalkan transaksi',
      variant: 'destructive'
    })
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (value: any) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericValue)
}

const getStatusVariant = (status: string) => {
  const variants: any = {
    'pending': 'secondary',
    'paid': 'default',
    'issued': 'default',
    'cancelled': 'destructive',
    'failed': 'destructive'
  }
  return variants[status] || 'secondary'
}

const canCancel = (status: string) => {
  return ['pending', 'paid'].includes(status)
}
</script>

<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />

      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Transaksi</h1>
            <p class="text-muted-foreground mt-1">Kelola semua transaksi tiket</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mitra</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="loading">
                    <TableCell colspan="7" class="text-center">Loading...</TableCell>
                  </TableRow>
                  <TableRow v-else-if="transactions.length === 0">
                    <TableCell colspan="7" class="text-center text-muted-foreground">Tidak ada data</TableCell>
                  </TableRow>
                  <TableRow v-else v-for="item in transactions" :key="item.id">
                    <TableCell class="font-medium">{{ item.trx_code }}</TableCell>
                    <TableCell>{{ formatDate(item.tanggal) }}</TableCell>
                    <TableCell>{{ item.mitra }}</TableCell>
                    <TableCell>{{ formatCurrency(item.jumlah) }}</TableCell>
                    <TableCell>{{ formatCurrency(item.fee) }}</TableCell>
                    <TableCell>
                      <Badge :variant="getStatusVariant(item.status)" :class="['paid', 'issued'].includes(item.status) ? 'bg-green-500 hover:bg-green-600' : ''">{{ item.status }}</Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <Button 
                        v-if="canCancel(item.status)"
                        size="sm" 
                        variant="destructive"
                        @click="openCancelDialog(item)"
                      >
                        Cancel
                      </Button>
                      <span v-else class="text-sm text-muted-foreground">-</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div v-if="transactions.length > 0" class="flex items-center justify-between mt-4">
                <p class="text-sm text-muted-foreground">Halaman {{ currentPage }} dari {{ lastPage }} ({{ total }} total)</p>
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">Sebelumnya</Button>
                  <Button variant="outline" size="sm" @click="changePage(currentPage + 1)" :disabled="currentPage === lastPage">Selanjutnya</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>

    <!-- Cancel Dialog -->
    <Dialog v-model:open="showCancelDialog">
      <DialogContent>
        <DialogTitle>Batalkan Transaksi</DialogTitle>
        <DialogDescription>Masukkan alasan pembatalan transaksi</DialogDescription>
        
        <div v-if="selectedTransaction" class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Kode Transaksi</Label>
            <p class="font-medium">{{ selectedTransaction.trx_code }}</p>
          </div>
          <div class="space-y-2">
            <Label>Mitra</Label>
            <p class="font-medium">{{ selectedTransaction.mitra }}</p>
          </div>
          <div class="space-y-2">
            <Label>Jumlah</Label>
            <p class="font-medium">{{ formatCurrency(selectedTransaction.jumlah) }}</p>
          </div>
          <div class="space-y-2">
            <Label for="reason">Alasan Pembatalan *</Label>
            <Input 
              id="reason"
              v-model="cancelReason" 
              placeholder="Masukkan alasan pembatalan..."
            />
          </div>
        </div>

        <div class="flex gap-2">
          <Button variant="destructive" @click="cancelTransaction">
            Batalkan Transaksi
          </Button>
          <Button variant="outline" @click="showCancelDialog = false">
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>
