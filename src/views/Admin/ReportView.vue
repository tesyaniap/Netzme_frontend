<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '16rem',
      '--header-height': '3rem',
    }"
  >
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Laporan Transaksi</h1>
            <p class="text-muted-foreground mt-1 text-sm sm:text-base">Generate dan export laporan transaksi</p>
          </div>

          <!-- Filters -->
          <Card>
            <CardHeader>
              <CardTitle>Filter Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input type="date" v-model="filters.start_date" />
                </div>
                <div class="space-y-2">
                  <Label>Tanggal Akhir</Label>
                  <Input type="date" v-model="filters.end_date" />
                </div>
                <div class="space-y-2">
                  <Label>Mitra</Label>
                  <Button variant="outline" class="w-full justify-start" @click="showMitraDialog = true">
                    {{ selectedMitraName || 'Pilih mitra' }}
                  </Button>
                </div>
                <div class="space-y-2">
                  <Label>Jenis Laporan</Label>
                  <Select v-model="selectedReportType">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Transaksi</SelectItem>
                      <SelectItem value="success">Transaksi Sukses</SelectItem>
                      <SelectItem value="pending">Transaksi Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="flex gap-2 mt-4">
                <Button @click="handleFilter">
                  <Filter class="mr-2 h-4 w-4" />
                  Terapkan Filter
                </Button>
                <Button variant="outline" @click="handleReset">Reset</Button>
              </div>
            </CardContent>
          </Card>

          <!-- Report Table -->
          <Card>
            <CardHeader>
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Data Laporan</CardTitle>
                  <CardDescription>{{ reportStore.filteredTransactions.length }} transaksi ditemukan</CardDescription>
                </div>
                <div class="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" class="flex-1 sm:flex-none" @click="reportStore.exportPDF">
                    <FileText class="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm" class="flex-1 sm:flex-none" @click="reportStore.exportExcel">
                    <FileSpreadsheet class="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mitra</TableHead>
                    <TableHead>Jenis Transaksi</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="reportStore.loading">
                    <TableCell colspan="6" class="text-center">Loading...</TableCell>
                  </TableRow>
                  <TableRow v-else-if="reportStore.filteredTransactions.length === 0">
                    <TableCell colspan="6" class="text-center text-muted-foreground">Tidak ada data</TableCell>
                  </TableRow>
                  <TableRow v-else v-for="item in reportStore.filteredTransactions" :key="item.id">
                    <TableCell>{{ formatDate(item.tanggal) }}</TableCell>
                    <TableCell class="font-medium">{{ item.mitra }}</TableCell>
                    <TableCell>{{ item.jenis_transaksi }}</TableCell>
                    <TableCell>{{ formatCurrency(item.jumlah) }}</TableCell>
                    <TableCell>{{ formatCurrency(item.fee) }}</TableCell>
                    <TableCell>
                      <Badge :variant="item.status === 'success' ? 'default' : 'secondary'">
                        {{ item.status }}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>
          </Card>
        </div>
      </div>
    </SidebarInset>

    <!-- Mitra Selection Dialog -->
    <Dialog v-model:open="showMitraDialog">
      <DialogContent>
        <DialogTitle>Pilih Mitra</DialogTitle>
        <DialogDescription>Pilih mitra untuk filter laporan</DialogDescription>
        <div class="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
          <div v-if="loadingMitra" class="text-center py-4 text-muted-foreground">
            Loading...
          </div>
          <div 
            v-else
            v-for="mitra in mitraList" 
            :key="mitra.id"
            @click="selectMitra(mitra)"
            class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
            :class="{ 'bg-muted': selectedMitra === mitra.id }"
          >
            <div>
              <div class="font-medium">{{ mitra.name }}</div>
              <div class="text-sm text-muted-foreground">{{ mitra.email || '-' }}</div>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showMitraDialog = false">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { Filter, FileText, FileSpreadsheet } from 'lucide-vue-next'
import { useReportStore } from '@/stores/report.store'
import { api } from '@/services/api.service'
import type { ReportFilter } from '@/types/report.types'

const reportStore = useReportStore()

const showMitraDialog = ref(false)
const selectedMitra = ref('all')
const selectedMitraName = ref('Semua Mitra')
const selectedReportType = ref('all')
const mitraList = ref<any[]>([])
const loadingMitra = ref(false)

const filters = ref<ReportFilter>({
  start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  report_type: 'all',
})

watch(selectedMitra, (val) => {
  filters.value.mitra_id = val === 'all' ? undefined : Number(val)
})

watch(selectedReportType, (val) => {
  filters.value.report_type = val
})

onMounted(() => {
  // Clear old data
  reportStore.$reset()
  fetchMitraList()
  handleFilter()
})

const fetchMitraList = async () => {
  loadingMitra.value = true
  try {
    const response = await api.get('/mitra')
    mitraList.value = [
      { id: 'all', name: 'Semua Mitra', email: 'Tampilkan semua' },
      ...response.data.data
    ]
  } catch (error) {
    console.error('Failed to fetch mitra:', error)
    mitraList.value = [{ id: 'all', name: 'Semua Mitra', email: 'Tampilkan semua' }]
  } finally {
    loadingMitra.value = false
  }
}

const handleFilter = () => {
  reportStore.fetchReports(filters.value)
}

const handleReset = () => {
  selectedMitra.value = 'all'
  selectedMitraName.value = 'Semua Mitra'
  selectedReportType.value = 'all'
  filters.value = {
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    report_type: 'all',
  }
  handleFilter()
}

const selectMitra = (mitra: any) => {
  selectedMitra.value = mitra.id
  selectedMitraName.value = mitra.name
  showMitraDialog.value = false
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  if (!amount && amount !== 0) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}
</script>
