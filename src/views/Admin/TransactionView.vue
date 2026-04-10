<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

const fetchTransactions = async (page = 1) => {
  loading.value = true
  try {
    const response = await api.get(`/reports/transactions?page=${page}&per_page=10`)
    if (response.data.status) {
      transactions.value = response.data.data || []
      currentPage.value = response.data.current_page || 1
      lastPage.value = response.data.last_page || 1
      total.value = response.data.total || 0
    }
  } catch {
    toast({ title: 'Gagal memuat data transaksi', variant: 'destructive' })
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
    toast({ title: 'Alasan pembatalan wajib diisi', variant: 'destructive' })
    return
  }
  try {
    await api.post(`/v1/transactions/${selectedTransaction.value.trx_code}/cancel`, {
      reason: cancelReason.value
    })
    toast({ title: 'Berhasil', description: `Transaksi ${selectedTransaction.value.trx_code} berhasil dibatalkan` })
    showCancelDialog.value = false
    fetchTransactions(currentPage.value)
  } catch (error: any) {
    toast({ title: error.response?.data?.message || 'Gagal membatalkan transaksi', variant: 'destructive' })
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

// ── Reschedule ────────────────────────────────────────────────
const showRescheduleDialog = ref(false)
const rescheduleStep = ref(1)
const rescheduleData = ref<any>(null)
const rescheduleDate = ref('')
const rescheduleReason = ref('')
const availableSchedules = ref<any[]>([])
const selectedSchedule = ref<any>(null)
const loadingSchedules = ref(false)
const availableSeats = ref<any[]>([])
const seatsByRow = ref<Record<string, any[]>>({})
const loadingSeats = ref(false)
const seatAssignments = ref<{ ticket_id: number; passenger_name: string; old_seat: string; new_seat_id: number | null }[]>([])
const allSeatsAssigned = computed(() => seatAssignments.value.length > 0 && seatAssignments.value.every(a => a.new_seat_id !== null))
const isSeatTakenByOther = (seatId: number, idx: number) =>
  seatAssignments.value.some((a, i) => i !== idx && a.new_seat_id === seatId)
const feeData = ref<any>(null)
const loadingFee = ref(false)
const submittingReschedule = ref(false)

const openReschedule = async (item: any) => {
  // Fetch detail transaksi untuk dapat ticket_ids & passengers
  try {
    const r = await api.get(`/transactions/${item.trx_code}`)
    const detail = r.data.data
    const ticketList = detail.tickets ?? []
    const passengerList = detail.passengers ?? []
    if (!ticketList.length) {
      toast({ title: 'Tidak ada tiket untuk transaksi ini', variant: 'destructive' })
      return
    }
    rescheduleData.value = {
      ...item,
      ticket_ids: ticketList.map((t: any) => t.id),
      passengers: passengerList,
      seats: ticketList.map((t: any) => t.seat?.seat_number ?? '-'),
    }
    seatAssignments.value = ticketList.map((t: any, i: number) => ({
      ticket_id: t.id,
      passenger_name: passengerList[i]?.name ?? `Penumpang ${i + 1}`,
      old_seat: t.seat?.seat_number ?? passengerList[i]?.seat_number ?? '-',
      new_seat_id: null,
    }))
  } catch {
    toast({ title: 'Gagal memuat data transaksi', variant: 'destructive' })
    return
  }
  rescheduleStep.value = 1
  rescheduleDate.value = ''
  rescheduleReason.value = ''
  selectedSchedule.value = null
  availableSchedules.value = []
  availableSeats.value = []
  feeData.value = null
  showRescheduleDialog.value = true
  fetchAvailableSchedules()
}

const fetchAvailableSchedules = async () => {
  if (!rescheduleData.value?.ticket_ids?.[0]) return
  loadingSchedules.value = true
  selectedSchedule.value = null
  try {
    const params: Record<string, any> = { ticket_id: rescheduleData.value.ticket_ids[0] }
    if (rescheduleDate.value) params.travel_date = rescheduleDate.value
    const res = await api.get('/tickets/reschedule/schedules', { params })
    availableSchedules.value = res.data.data ?? []
  } catch {
    toast({ title: 'Gagal memuat jadwal', variant: 'destructive' })
  } finally {
    loadingSchedules.value = false
  }
}

const goToSeatStep = async () => {
  rescheduleStep.value = 2
  loadingSeats.value = true
  seatAssignments.value.forEach(a => a.new_seat_id = null)
  try {
    const res = await api.get('/tickets/reschedule/seats', { params: { schedule_id: selectedSchedule.value.id } })
    availableSeats.value = res.data.data ?? []
    seatsByRow.value = availableSeats.value.reduce((acc: Record<string, any[]>, seat: any) => {
      const row = String(seat.row)
      if (!acc[row]) acc[row] = []
      acc[row].push(seat)
      return acc
    }, {})
  } catch {
    toast({ title: 'Gagal memuat kursi', variant: 'destructive' })
  } finally {
    loadingSeats.value = false
  }
}

const goToConfirmStep = async () => {
  rescheduleStep.value = 3
  loadingFee.value = true
  try {
    const res = await api.post('/tickets/reschedule/calculate-fee', {
      ticket_id: rescheduleData.value.ticket_ids[0],
      new_schedule_id: selectedSchedule.value.id,
    })
    feeData.value = res.data.data
  } catch {
    toast({ title: 'Gagal menghitung biaya', variant: 'destructive' })
  } finally {
    loadingFee.value = false
  }
}

const submitReschedule = async () => {
  submittingReschedule.value = true
  try {
    await api.post('/tickets/reschedule/transaction', {
      trx_code: rescheduleData.value.trx_code,
      new_schedule_id: selectedSchedule.value.id,
      seat_assignments: seatAssignments.value.map(a => ({ ticket_id: a.ticket_id, new_seat_id: a.new_seat_id })),
      reason: rescheduleReason.value || null,
    })
    toast({ title: 'Reschedule berhasil' })
    showRescheduleDialog.value = false
    fetchTransactions(currentPage.value)
  } catch (err: any) {
    toast({ title: 'Gagal reschedule', description: err.message, variant: 'destructive' })
  } finally {
    submittingReschedule.value = false
  }
}
</script>

<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />

      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Transaksi</h1>
            <p class="text-muted-foreground mt-1 text-sm sm:text-base">Kelola semua transaksi tiket</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle class="text-lg sm:text-xl">Daftar Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead class="min-w-[120px]">Kode Transaksi</TableHead>
                      <TableHead class="min-w-[120px]">Tanggal</TableHead>
                      <TableHead class="min-w-[100px]">Mitra</TableHead>
                      <TableHead class="min-w-[100px]">Jumlah</TableHead>
                      <TableHead class="min-w-[80px]">Fee</TableHead>
                      <TableHead class="min-w-[80px]">Status</TableHead>
                      <TableHead class="text-right min-w-[80px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-if="loading">
                      <TableCell colspan="7" class="text-center py-6 sm:py-8 text-sm">Loading...</TableCell>
                    </TableRow>
                    <TableRow v-else-if="transactions.length === 0">
                      <TableCell colspan="7" class="text-center py-6 sm:py-8 text-muted-foreground text-sm">Tidak ada data</TableCell>
                    </TableRow>
                    <TableRow v-else v-for="item in transactions" :key="item.id">
                      <TableCell class="font-medium text-xs sm:text-sm">{{ item.trx_code }}</TableCell>
                      <TableCell class="text-xs sm:text-sm">{{ formatDate(item.tanggal) }}</TableCell>
                      <TableCell class="text-xs sm:text-sm">{{ item.mitra }}</TableCell>
                      <TableCell class="text-xs sm:text-sm">{{ formatCurrency(item.jumlah) }}</TableCell>
                      <TableCell class="text-xs sm:text-sm">{{ formatCurrency(item.fee) }}</TableCell>
                      <TableCell>
                        <Badge :variant="getStatusVariant(item.status)" :class="['paid', 'issued'].includes(item.status) ? 'bg-green-500 hover:bg-green-600' : ''" class="text-xs">{{ item.status }}</Badge>
                      </TableCell>
                      <TableCell class="text-right">
                        <div class="flex justify-end gap-1">
                          <Button
                            v-if="item.status === 'paid'"
                            size="sm" variant="outline"
                            @click="openReschedule(item)"
                            class="text-xs h-7 px-2"
                          >Reschedule</Button>
                          <Button 
                            v-if="canCancel(item.status)"
                            size="sm" 
                            variant="destructive"
                            @click="openCancelDialog(item)"
                            class="text-xs h-7 px-2"
                          >Cancel</Button>
                          <span v-if="!canCancel(item.status) && item.status !== 'paid'" class="text-xs text-muted-foreground">-</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div v-if="transactions.length > 0" class="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 sm:gap-0">
                <p class="text-xs sm:text-sm text-muted-foreground">Halaman {{ currentPage }} dari {{ lastPage }} ({{ total }} total)</p>
                <div class="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="flex-1 sm:flex-none text-xs">Sebelumnya</Button>
                  <Button variant="outline" size="sm" @click="changePage(currentPage + 1)" :disabled="currentPage === lastPage" class="flex-1 sm:flex-none text-xs">Selanjutnya</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>

    <!-- Cancel Dialog -->
    <Dialog v-model:open="showCancelDialog">
      <DialogContent class="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <DialogTitle class="text-lg sm:text-xl">Batalkan Transaksi</DialogTitle>
        <DialogDescription class="text-sm">Masukkan alasan pembatalan transaksi</DialogDescription>
        
        <div v-if="selectedTransaction" class="space-y-3 sm:space-y-4 py-4">
          <div class="space-y-2">
            <Label class="text-sm">Kode Transaksi</Label>
            <p class="font-medium text-sm sm:text-base">{{ selectedTransaction.trx_code }}</p>
          </div>
          <div class="space-y-2">
            <Label class="text-sm">Mitra</Label>
            <p class="font-medium text-sm sm:text-base">{{ selectedTransaction.mitra }}</p>
          </div>
          <div class="space-y-2">
            <Label class="text-sm">Jumlah</Label>
            <p class="font-medium text-sm sm:text-base">{{ formatCurrency(selectedTransaction.jumlah) }}</p>
          </div>
          <div class="space-y-2">
            <Label for="reason" class="text-sm">Alasan Pembatalan *</Label>
            <Input 
              id="reason"
              v-model="cancelReason" 
              placeholder="Masukkan alasan pembatalan..."
              class="text-sm"
            />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <Button variant="destructive" @click="cancelTransaction" class="text-sm">
            Batalkan Transaksi
          </Button>
          <Button variant="outline" @click="showCancelDialog = false" class="text-sm">Batal</Button>
        </div>
      </DialogContent>
    </Dialog>
    <!-- Reschedule Dialog -->
    <Dialog v-model:open="showRescheduleDialog">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Reschedule Transaksi</DialogTitle>
        <DialogDescription>
          <span class="font-medium text-foreground">{{ rescheduleData?.trx_code }}</span> ·
          {{ rescheduleData?.customer_name }} · {{ rescheduleData?.ticket_ids?.length ?? 0 }} tiket
        </DialogDescription>

        <div class="flex items-center gap-2 text-sm mb-2">
          <span :class="rescheduleStep >= 1 ? 'text-primary font-semibold' : 'text-muted-foreground'">1. Pilih Jadwal</span>
          <span class="text-muted-foreground">→</span>
          <span :class="rescheduleStep >= 2 ? 'text-primary font-semibold' : 'text-muted-foreground'">2. Pilih Kursi</span>
          <span class="text-muted-foreground">→</span>
          <span :class="rescheduleStep >= 3 ? 'text-primary font-semibold' : 'text-muted-foreground'">3. Konfirmasi</span>
        </div>

        <!-- Step 1 -->
        <div v-if="rescheduleStep === 1" class="space-y-4">
          <div class="flex gap-2">
            <Input v-model="rescheduleDate" type="date" class="w-[160px]" />
            <Button variant="outline" :disabled="loadingSchedules" @click="fetchAvailableSchedules">Cari Jadwal</Button>
          </div>
          <div v-if="loadingSchedules" class="text-center py-6 text-muted-foreground text-sm">Memuat jadwal...</div>
          <div v-else-if="availableSchedules.length === 0" class="text-center py-6 text-muted-foreground text-sm">Tidak ada jadwal tersedia</div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="s in availableSchedules" :key="s.id"
              class="p-3 border rounded-lg cursor-pointer transition-colors"
              :class="selectedSchedule?.id === s.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'"
              @click="selectedSchedule = s"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-sm">{{ s.route?.origin_city }} → {{ s.route?.destination_city }}</p>
                  <p class="text-xs text-muted-foreground">{{ s.travel_date }} · {{ s.departure_time }} - {{ s.arrival_time }}</p>
                  <p class="text-xs text-muted-foreground">{{ s.vehicle?.name }} ({{ s.vehicle?.plate_number }})</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-sm">{{ formatCurrency(Number(s.price)) }}</p>
                  <p class="text-xs text-muted-foreground">{{ s.available_seats }} kursi tersedia</p>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showRescheduleDialog = false">Batal</Button>
            <Button :disabled="!selectedSchedule" @click="goToSeatStep">Lanjut →</Button>
          </div>
        </div>

        <!-- Step 2 -->
        <div v-if="rescheduleStep === 2" class="space-y-4">
          <div class="p-3 bg-muted/50 rounded-lg text-sm">
            <p class="font-medium">{{ selectedSchedule?.route?.origin_city }} → {{ selectedSchedule?.route?.destination_city }}</p>
            <p class="text-muted-foreground">{{ selectedSchedule?.travel_date }} · {{ selectedSchedule?.departure_time }}</p>
          </div>
          <div v-if="loadingSeats" class="text-center py-6 text-muted-foreground text-sm">Memuat kursi...</div>
          <div v-else-if="availableSeats.length === 0" class="text-center py-6 text-muted-foreground text-sm">Tidak ada kursi tersedia</div>
          <div v-else class="space-y-4">
            <div v-for="(a, idx) in seatAssignments" :key="a.ticket_id" class="p-3 border rounded-lg space-y-2">
              <p class="text-sm font-medium">{{ a.passenger_name }} <span class="text-muted-foreground font-normal">(kursi lama: {{ a.old_seat }})</span></p>
              <div class="bg-gray-50 rounded-lg p-3 border">
                <div class="max-h-[280px] overflow-y-auto">
                  <div class="space-y-2">
                    <div v-for="(rowSeats, rowNum) in seatsByRow" :key="rowNum" class="flex gap-3 justify-center items-center">
                      <div class="flex gap-1.5">
                        <div
                          v-for="seat in rowSeats.filter((s: any) => s.column <= 2)" :key="seat.id"
                          class="w-11 h-11 rounded border-2 text-xs font-bold flex items-center justify-center transition-all"
                          :class="[
                            isSeatTakenByOther(seat.id, idx) ? 'bg-orange-200 border-orange-400 text-orange-600 cursor-not-allowed' :
                            a.new_seat_id === seat.id ? 'bg-blue-500 text-white border-blue-600 shadow cursor-pointer' :
                            'bg-white border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer'
                          ]"
                          @click="!isSeatTakenByOther(seat.id, idx) && (a.new_seat_id = seat.id)"
                        >{{ seat.seat_number }}</div>
                      </div>
                      <div class="w-6 text-center text-xs text-gray-400 font-medium">{{ rowNum }}</div>
                      <div class="flex gap-1.5">
                        <div
                          v-for="seat in rowSeats.filter((s: any) => s.column > 2)" :key="seat.id"
                          class="w-11 h-11 rounded border-2 text-xs font-bold flex items-center justify-center transition-all"
                          :class="[
                            isSeatTakenByOther(seat.id, idx) ? 'bg-orange-200 border-orange-400 text-orange-600 cursor-not-allowed' :
                            a.new_seat_id === seat.id ? 'bg-blue-500 text-white border-blue-600 shadow cursor-pointer' :
                            'bg-white border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer'
                          ]"
                          @click="!isSeatTakenByOther(seat.id, idx) && (a.new_seat_id = seat.id)"
                        >{{ seat.seat_number }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex gap-3 mt-3 text-xs justify-center">
                  <span class="flex items-center gap-1"><span class="w-4 h-4 rounded border-2 border-gray-300 bg-white inline-block"></span> Tersedia</span>
                  <span class="flex items-center gap-1"><span class="w-4 h-4 rounded border-2 border-blue-600 bg-blue-500 inline-block"></span> Dipilih</span>
                  <span class="flex items-center gap-1"><span class="w-4 h-4 rounded border-2 border-orange-400 bg-orange-200 inline-block"></span> Penumpang lain</span>
                </div>
              </div>
              <p v-if="a.new_seat_id" class="text-xs text-blue-600 font-medium">
                Kursi dipilih: {{ availableSeats.find(s => s.id === a.new_seat_id)?.seat_number }}
              </p>
            </div>
          </div>
          <div class="flex justify-between gap-2">
            <Button variant="outline" @click="rescheduleStep = 1">← Kembali</Button>
            <Button :disabled="!allSeatsAssigned" @click="goToConfirmStep">Lanjut →</Button>
          </div>
        </div>

        <!-- Step 3 -->
        <div v-if="rescheduleStep === 3" class="space-y-4">
          <div v-if="loadingFee" class="text-center py-6 text-muted-foreground text-sm">Menghitung biaya...</div>
          <div v-else class="space-y-3">
            <div class="p-4 border rounded-lg text-sm space-y-3">
              <p class="font-semibold">Ringkasan Reschedule</p>
              <div class="grid grid-cols-2 gap-2">
                <div><p class="text-muted-foreground">Jadwal Baru</p><p class="font-medium">{{ selectedSchedule?.travel_date }} · {{ selectedSchedule?.departure_time }}</p></div>
                <div><p class="text-muted-foreground">Jumlah Tiket</p><p class="font-medium">{{ seatAssignments.length }} tiket</p></div>
              </div>
              <div class="space-y-1">
                <p class="text-muted-foreground">Kursi Baru</p>
                <div v-for="a in seatAssignments" :key="a.ticket_id" class="flex justify-between text-xs p-1.5 bg-muted/30 rounded">
                  <span>{{ a.passenger_name }}</span>
                  <span class="font-medium">{{ availableSeats.find(s => s.id === a.new_seat_id)?.seat_number }}</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 pt-2 border-t">
                <div><p class="text-muted-foreground">Biaya/tiket</p><p class="font-medium">{{ formatCurrency(feeData?.total_fee ?? 0) }}</p></div>
                <div><p class="text-muted-foreground">Total</p><p class="font-bold">{{ formatCurrency((feeData?.total_fee ?? 0) * seatAssignments.length) }}</p></div>
              </div>
            </div>
            <div>
              <Label class="text-sm">Alasan (opsional)</Label>
              <Input v-model="rescheduleReason" placeholder="Masukkan alasan..." class="mt-1" />
            </div>
          </div>
          <div class="flex justify-between gap-2">
            <Button variant="outline" @click="rescheduleStep = 2">← Kembali</Button>
            <Button :disabled="loadingFee || submittingReschedule" @click="submitReschedule">
              {{ submittingReschedule ? 'Memproses...' : 'Konfirmasi Reschedule' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>
