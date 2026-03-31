<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import SiteHeader from '@/components/SiteHeader.vue'
import SidebarMitra from '@/components/SidebarMitra.vue'
import TicketPrint from '@/components/TicketPrint.vue'
import { useTransactionStore } from '@/stores/mitra/transaction.store'
import { useToast } from '@/components/ui/toast/use-toast'

const store = useTransactionStore()
const { toast } = useToast()

const origin = ref('')
const destination = ref('')
const today = new Date().toISOString().split('T')[0]
const travel_date = ref(today)
const selectedSchedule = ref<any>(null)
const selectedSeats = ref<number[]>([])
const selectedSeatNumbers = ref<string[]>([])

// Dialog states
const showSearchDialog = ref(false)
const showScheduleDialog = ref(false)
const showSeatMapDialog = ref(false)
const showPassengerForm = ref(false)
const showPaymentDialog = ref(false)
const showIssueDialog = ref(false)

// Debug watcher
watch(showScheduleDialog, (newVal, oldVal) => {
  console.log('🔔 showScheduleDialog changed:', oldVal, '->', newVal)
  if (newVal === false && oldVal === true) {
    console.trace('❌ Dialog closed! Stack trace:')
  }
})

// Customer info
const customerName = ref('')
const customerPhone = ref('')
const customerEmail = ref('')

// Passenger form
const passengers = ref<Array<{name: string, identity_number: string}>>([])
const currentTransaction = ref<any>(null)

const openSearchDialog = () => {
  showSearchDialog.value = true
  store.fetchAvailableSchedules()
}

const search = async () => {
  if (!origin.value || !destination.value || !travel_date.value) {
    toast({
      title: 'Error',
      description: 'Semua field pencarian wajib diisi',
      variant: 'destructive'
    })
    return
  }

  try {
    console.log('🔍 Starting search with params:', {
      origin: origin.value,
      destination: destination.value,
      travel_date: travel_date.value
    })
    
    await store.search({
      origin: origin.value,
      destination: destination.value,
      travel_date: travel_date.value
    })
    
    console.log('✅ Search completed. Schedules:', store.schedules)
    console.log('📊 Schedules count:', store.schedules.length)
    
    if (store.schedules.length > 0) {
      console.log('🔍 First schedule data:', JSON.stringify(store.schedules[0], null, 2))
    }
    
    if (store.schedules.length === 0) {
      toast({
        title: 'Tidak Ada Jadwal',
        description: 'Tidak ada jadwal tersedia untuk rute ini',
        variant: 'destructive'
      })
      return
    }
    
    console.log('🚀 Opening schedule dialog...')
    showSearchDialog.value = false
    
    // Use nextTick to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100))
    showScheduleDialog.value = true
    console.log('✅ Schedule dialog opened:', showScheduleDialog.value)
  } catch (error: any) {
    console.error('❌ Search error:', error)
    toast({
      title: 'Pencarian Gagal',
      description: error.message || 'Terjadi kesalahan saat mencari jadwal',
      variant: 'destructive'
    })
  }
}

const selectSchedule = async (schedule: any) => {
  console.log('🎯 Schedule selected:', schedule)
  selectedSchedule.value = schedule
  travel_date.value = schedule.travel_date
  selectedSeats.value = []
  selectedSeatNumbers.value = []
  
  try {
    showScheduleDialog.value = false
    await store.getSeatMap(schedule.id, travel_date.value)
    showSeatMapDialog.value = true
  } catch (error: any) {
    console.error('❌ Seat map error:', error)
    toast({
      title: 'Error',
      description: error.message || 'Gagal memuat peta kursi',
      variant: 'destructive'
    })
  }
}

const toggleSeat = (seat: any) => {
  if (seat.status === 'booked') return

  const seatIdIndex = selectedSeats.value.indexOf(seat.id)

  if (seatIdIndex > -1) {
    selectedSeats.value.splice(seatIdIndex, 1)
    selectedSeatNumbers.value.splice(seatIdIndex, 1)
  } else {
    selectedSeats.value.push(seat.id)
    selectedSeatNumbers.value.push(seat.seat_number)
  }
}

const isSelected = (seatId: number) => {
  return selectedSeats.value.includes(seatId)
}

const proceedToPassengerForm = () => {
  if (selectedSeats.value.length === 0) {
    toast({
      title: 'Error',
      description: 'Pilih minimal 1 kursi',
      variant: 'destructive'
    })
    return
  }

  passengers.value = selectedSeats.value.map(() => ({
    name: '',
    identity_number: ''
  }))
  showSeatMapDialog.value = false
  setTimeout(() => {
    showPassengerForm.value = true
  }, 300)
}

// Step 3: Book
const bookTicket = async () => {
  if (!selectedSchedule.value) {
    toast({
      title: 'Error',
      description: 'Jadwal tidak ditemukan, silakan pilih ulang',
      variant: 'destructive'
    })
    showPassengerForm.value = false
    return
  }

  const isValid = passengers.value.every(p => p.name && p.identity_number)
  if (!isValid) {
    toast({
      title: 'Error',
      description: 'Lengkapi data semua penumpang',
      variant: 'destructive'
    })
    return
  }

  try {
    console.log('Selected schedule:', selectedSchedule.value)
    console.log('Booking with data:', {
      provider_code: selectedSchedule.value.provider_code,
      travel_date: travel_date.value,
      seats: selectedSeats.value,
      passengers: passengers.value
    })

    const result = await store.book({
      schedule_id: selectedSchedule.value.id,
      travel_date: travel_date.value,
      seats: selectedSeats.value,
      customer_name: customerName.value,
      customer_phone: customerPhone.value,
      customer_email: customerEmail.value,
      passengers: passengers.value
    })

    console.log('Booking result:', result)
    currentTransaction.value = result
    
    // Close passenger form first
    showPassengerForm.value = false
    
    // Show success toast
    toast({
      title: 'Booking Berhasil',
      description: `Kode: ${result.trx_code}`
    })

    // Wait a bit then open payment dialog
    setTimeout(() => {
      console.log('Opening payment dialog, currentTransaction:', currentTransaction.value)
      showPaymentDialog.value = true
      console.log('showPaymentDialog:', showPaymentDialog.value)
    }, 300)
  } catch (error: any) {
    console.error('Booking error:', error)
    toast({
      title: 'Booking Gagal',
      description: error.message || 'Terjadi kesalahan',
      variant: 'destructive'
    })
  }
}

// Step 4: Pay
const payTransaction = async () => {
  try {
    console.log('Paying transaction:', currentTransaction.value.trx_code)
    const result = await store.pay(currentTransaction.value.trx_code)
    console.log('Payment result:', result)
    
    currentTransaction.value = result
    
    toast({
      title: 'Pembayaran Berhasil',
      description: 'Silakan cetak tiket'
    })

    // Close payment dialog first
    showPaymentDialog.value = false
    
    // Wait then open issue dialog
    setTimeout(() => {
      console.log('Opening issue dialog, currentTransaction:', currentTransaction.value)
      showIssueDialog.value = true
      console.log('showIssueDialog:', showIssueDialog.value)
    }, 300)
  } catch (error: any) {
    console.error('Payment error:', error)
    toast({
      title: 'Pembayaran Gagal',
      description: error.message || 'Saldo tidak cukup',
      variant: 'destructive'
    })
  }
}

// Step 5: Issue
const issueTicket = async () => {
  try {
    const result = await store.issue(currentTransaction.value.trx_code)
    
    toast({
      title: 'Tiket Berhasil Dicetak',
      description: `Fee: Rp ${result.fee_earned?.toLocaleString('id-ID')}`
    })

    // Reset form
    showIssueDialog.value = false
    selectedSchedule.value = null
    selectedSeats.value = []
    selectedSeatNumbers.value = []
    currentTransaction.value = null
    customerName.value = ''
    customerPhone.value = ''
    customerEmail.value = ''
    
    // Refresh statistics and history
    loadStatistics()
    loadHistory()
  } catch (error: any) {
    toast({
      title: 'Issue Gagal',
      description: error.message || 'Terjadi kesalahan',
      variant: 'destructive'
    })
  }
}

// Cancel transaction
const cancelTransaction = async () => {
  if (!confirm('Yakin ingin membatalkan transaksi?')) return

  try {
    await store.cancel(currentTransaction.value.trx_code, 'Dibatalkan oleh user')
    
    toast({
      title: 'Transaksi Dibatalkan',
      description: 'Refund akan diproses'
    })

    showPaymentDialog.value = false
    showIssueDialog.value = false
    currentTransaction.value = null
    
    // Refresh statistics and history
    loadStatistics()
    loadHistory()
  } catch (error: any) {
    toast({
      title: 'Cancel Gagal',
      description: error.message || 'Terjadi kesalahan',
      variant: 'destructive'
    })
  }
}

// Statistics & History
const selectedPeriod = ref('today')
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const showPrintDialog = ref(false)
const selectedTicket = ref<any>(null)

const loadStatistics = async () => {
  await store.fetchStatistics('today')
  if (selectedPeriod.value === 'year') {
    await store.fetchStatistics('year', undefined, selectedYear.value)
  } else if (selectedPeriod.value === 'month') {
    await store.fetchStatistics('month', selectedMonth.value, selectedYear.value)
  }
}

const loadHistory = async () => {
  await store.fetchHistory(1, 5)
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    'issued': 'bg-green-100 text-green-700',
    'paid': 'bg-blue-100 text-blue-700',
    'booked': 'bg-yellow-100 text-yellow-700',
    'cancelled': 'bg-red-100 text-red-700'
  }
  return badges[status] || 'bg-gray-100 text-gray-700'
}

const printTicket = async (trxCode: string) => {
  try {
    const ticketData = await store.fetchTicketData(trxCode)
    selectedTicket.value = ticketData
    showPrintDialog.value = true
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Gagal memuat data tiket',
      variant: 'destructive'
    })
  }
}

watch([selectedPeriod, selectedMonth, selectedYear], () => {
  loadStatistics()
})

// Load initial data
onMounted(() => {
  loadStatistics()
  loadHistory()
})
</script>



<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '16rem',
      '--header-height': '3rem',
    }"
  >
    <SidebarMitra />
    <SidebarInset>
      <SiteHeader />

      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">

          <!-- PAGE HEADER -->
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Transaksi Tiket</h1>
            <p class="text-muted-foreground mt-1">
              Cari dan lakukan pemesanan tiket bus.
            </p>
          </div>

          <!-- BUTTON TO OPEN SEARCH -->
          <Card>
            <CardContent class="pt-6">
              <Button @click="openSearchDialog" size="lg" class="w-full">
                Mulai Transaksi Baru
              </Button>
            </CardContent>
          </Card>

          <!-- STATISTICS & HISTORY SECTION -->
          <div class="grid gap-4 md:grid-cols-2">
            <!-- LEFT: Statistics -->
            <Card>
              <CardHeader>
                <CardTitle>Statistik Transaksi</CardTitle>
                <CardDescription>Ringkasan transaksi Anda</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <!-- Today Stats -->
                <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="text-sm text-muted-foreground mb-1">Hari Ini</div>
                  <div class="flex justify-between items-end">
                    <div>
                      <div class="text-2xl font-bold text-blue-700">{{ store.statistics.today.count || 0 }}</div>
                      <div class="text-xs text-muted-foreground">Transaksi</div>
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-semibold text-blue-600">Rp {{ (store.statistics.today.amount || 0).toLocaleString('id-ID') }}</div>
                      <div class="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>

                <!-- Year/Month Filter -->
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <Button 
                      @click="selectedPeriod = 'year'" 
                      :variant="selectedPeriod === 'year' ? 'default' : 'outline'"
                      size="sm"
                      class="flex-1"
                    >
                      Tahun Ini
                    </Button>
                    <Button 
                      @click="selectedPeriod = 'month'" 
                      :variant="selectedPeriod === 'month' ? 'default' : 'outline'"
                      size="sm"
                      class="flex-1"
                    >
                      Per Bulan
                    </Button>
                  </div>

                  <!-- Month Selector -->
                  <div v-if="selectedPeriod === 'month'" class="flex gap-2">
                    <select v-model="selectedMonth" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                      <option :value="1">Januari</option>
                      <option :value="2">Februari</option>
                      <option :value="3">Maret</option>
                      <option :value="4">April</option>
                      <option :value="5">Mei</option>
                      <option :value="6">Juni</option>
                      <option :value="7">Juli</option>
                      <option :value="8">Agustus</option>
                      <option :value="9">September</option>
                      <option :value="10">Oktober</option>
                      <option :value="11">November</option>
                      <option :value="12">Desember</option>
                    </select>
                    <select v-model="selectedYear" class="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm">
                      <option :value="2024">2024</option>
                      <option :value="2023">2023</option>
                    </select>
                  </div>
                </div>

                <!-- Period Stats -->
                <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div class="text-sm text-muted-foreground mb-1">
                    {{ selectedPeriod === 'year' ? 'Tahun ' + selectedYear : 'Bulan ' + selectedMonth + '/' + selectedYear }}
                  </div>
                  <div class="flex justify-between items-end">
                    <div>
                      <div class="text-2xl font-bold text-green-700">
                        {{ selectedPeriod === 'year' ? (store.statistics.year.count || 0) : (store.statistics.month.count || 0) }}
                      </div>
                      <div class="text-xs text-muted-foreground">Transaksi</div>
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-semibold text-green-600">
                        Rp {{ (selectedPeriod === 'year' ? (store.statistics.year.amount || 0) : (store.statistics.month.amount || 0)).toLocaleString('id-ID') }}
                      </div>
                      <div class="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- RIGHT: Recent Transactions -->
            <Card>
              <CardHeader>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <CardDescription>Histori transaksi terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="store.history.length > 0" class="space-y-3">
                  <div 
                    v-for="trx in store.history" 
                    :key="trx.id"
                    class="p-3 border rounded-lg hover:shadow-sm transition-all"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <div class="font-medium text-sm">{{ trx.trx_code }}</div>
                        <div class="text-xs text-muted-foreground">{{ trx.route }}</div>
                      </div>
                      <span 
                        class="text-xs px-2 py-1 rounded-full font-medium"
                        :class="getStatusBadge(trx.status)"
                      >
                        {{ trx.status }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <div class="text-sm font-semibold text-primary">
                        Rp {{ trx.amount.toLocaleString('id-ID') }}
                      </div>
                      <Button 
                        v-if="trx.status === 'issued'"
                        @click="printTicket(trx.trx_code)" 
                        size="sm" 
                        variant="outline"
                      >
                        Cetak
                      </Button>
                    </div>
                  </div>
                </div>
                <div v-else class="py-8 text-center text-muted-foreground">
                  Belum ada transaksi
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- SEARCH DIALOG -->
          <Dialog v-model:open="showSearchDialog">
            <DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogTitle>Pencarian Tiket</DialogTitle>
              <DialogDescription>
                Masukkan kota asal, tujuan, dan tanggal keberangkatan
              </DialogDescription>
              
              <div class="grid gap-4 py-4">
                <div>
                  <Label>Kota Asal</Label>
                  <Input v-model="origin" placeholder="Kota Asal" />
                </div>
                <div>
                  <Label>Kota Tujuan</Label>
                  <Input v-model="destination" placeholder="Kota Tujuan" />
                </div>
                <div>
                  <Label>Tanggal Keberangkatan</Label>
                  <Input v-model="travel_date" type="date" :min="today" />
                </div>
              </div>

              <div class="flex gap-2">
                <Button @click.prevent="search" :disabled="store.loading" class="flex-1">
                  {{ store.loading ? 'Mencari...' : 'Cari Tiket' }}
                </Button>
                <Button variant="outline" @click="showSearchDialog = false">
                  Batal
                </Button>
              </div>

              <!-- Available Schedules -->
              <div class="border-t pt-4 mt-2">
                <h3 class="font-medium text-sm mb-3">Jadwal Tersedia</h3>
                <div v-if="store.availableLoading" class="py-4 text-center text-sm text-muted-foreground">
                  Memuat jadwal...
                </div>
                <div v-else-if="store.availableSchedules.length > 0" class="space-y-2 max-h-[300px] overflow-y-auto">
                  <div
                    v-for="schedule in store.availableSchedules"
                    :key="schedule.id"
                    class="border rounded-lg p-3 flex justify-between items-center hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all"
                    @click="selectSchedule(schedule); showSearchDialog = false"
                  >
                    <div>
                      <div class="font-medium text-sm">{{ schedule.vehicle?.name || 'Bus' }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ schedule.travel_date }} · Berangkat: {{ schedule.departure_time }}
                      </div>
                      <div class="font-semibold text-primary text-sm mt-0.5">
                        Rp {{ parseFloat(schedule.price).toLocaleString('id-ID') }}
                      </div>
                    </div>
                    <div class="text-right flex flex-col items-end gap-2">
                      <span class="text-xs px-2 py-1 rounded-full font-medium"
                        :class="(schedule.available_seats ?? 0) > 5 ? 'bg-green-100 text-green-700' : (schedule.available_seats ?? 0) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'"
                      >
                        {{ schedule.available_seats ?? 0 }} / {{ schedule.total_seats ?? '-' }} kursi
                      </span>
                      <Button variant="secondary" size="sm">Pilih</Button>
                    </div>
                  </div>
                </div>
                <div v-else class="py-4 text-center text-sm text-muted-foreground">
                  Tidak ada jadwal tersedia saat ini
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <!-- SCHEDULE DIALOG -->
          <Dialog v-model:open="showScheduleDialog" :modal="true">
            <DialogContent class="max-w-2xl" @pointerDownOutside.prevent @escapeKeyDown.prevent>
              <DialogTitle>Hasil Pencarian ({{ store.schedules.length }} jadwal)</DialogTitle>
              <DialogDescription>
                Pilih jadwal yang tersedia
              </DialogDescription>
              
              <div v-if="store.schedules.length > 0" class="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                <div
                  v-for="schedule in store.schedules"
                  :key="schedule.id"
                  class="border rounded-lg p-4 flex justify-between items-center transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
                  @click="selectSchedule(schedule)"
                >
                  <div>
                    <div class="font-medium">{{ schedule.vehicle?.name || 'Bus' }}</div>
                    <div class="text-sm text-muted-foreground">
                      Berangkat: {{ schedule.departure_time }}
                    </div>
                    <div class="font-semibold mt-1 text-primary">
                      Rp {{ parseFloat(schedule.price).toLocaleString('id-ID') }}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Pilih
                  </Button>
                </div>
              </div>
              <div v-else class="py-8 text-center text-muted-foreground">
                Tidak ada jadwal tersedia
              </div>
            </DialogContent>
          </Dialog>

          <!-- SEAT MAP DIALOG -->
          <Dialog v-model:open="showSeatMapDialog">
            <DialogContent class="max-w-md">
              <DialogTitle>Pilih Kursi</DialogTitle>
              <DialogDescription>
                Tersedia: {{ store.seatMapData?.seat_summary?.available_seats || 0 }}/{{ store.seatMapData?.seat_summary?.total_seats || 0 }}
              </DialogDescription>
              
              <div class="py-4">
                <!-- Seat Grid Container -->
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <!-- Seat Grid -->
                  <div class="max-h-[350px] overflow-y-auto">
                    <div class="space-y-2">
                      <div v-for="(rowSeats, rowNum) in store.seatMapData?.seats_by_row" :key="rowNum" class="flex gap-3 justify-center items-center">
                        <!-- Left seats -->
                        <div class="flex gap-1.5">
                          <div
                            v-for="seat in rowSeats.filter(s => s.column <= 2)"
                            :key="seat.id"
                            @click="toggleSeat(seat)"
                            class="w-11 h-11 rounded border-2 text-xs font-bold flex items-center justify-center transition-all"
                            :class="[
                              seat.status === 'booked' ? 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed' :
                              isSelected(seat.id) ? 'bg-blue-500 text-white border-blue-600 shadow' :
                              'bg-white border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer'
                            ]"
                          >
                            <span v-if="seat.status !== 'booked'">{{ seat.seat_number }}</span>
                            <span v-else class="text-xl">✕</span>
                          </div>
                        </div>
                        
                        <!-- Aisle -->
                        <div class="w-6 flex items-center justify-center text-xs font-medium text-gray-400">
                          {{ String.fromCharCode(64 + parseInt(rowNum)) }}
                        </div>
                        
                        <!-- Right seats -->
                        <div class="flex gap-1.5">
                          <div
                            v-for="seat in rowSeats.filter(s => s.column > 2)"
                            :key="seat.id"
                            @click="toggleSeat(seat)"
                            class="w-11 h-11 rounded border-2 text-xs font-bold flex items-center justify-center transition-all"
                            :class="[
                              seat.status === 'booked' ? 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed' :
                              isSelected(seat.id) ? 'bg-blue-500 text-white border-blue-600 shadow' :
                              'bg-white border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer'
                            ]"
                          >
                            <span v-if="seat.status !== 'booked'">{{ seat.seat_number }}</span>
                            <span v-else class="text-xl">✕</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selected Info -->
                <div v-if="selectedSeats.length" class="mt-4">
                  <div class="text-sm p-3 bg-blue-50 rounded border border-blue-200">
                    Dipilih: <span class="font-bold text-blue-700">{{ selectedSeatNumbers.join(', ') }}</span>
                  </div>
                  <Button @click="proceedToPassengerForm" class="w-full mt-2">
                    Lanjut →
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <!-- PASSENGER FORM DIALOG -->
          <Dialog v-model:open="showPassengerForm">
            <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogTitle>Data Penumpang</DialogTitle>
              <DialogDescription>Lengkapi data untuk {{ selectedSeats.length }} penumpang</DialogDescription>
              
              <div class="space-y-4 py-4">
                <div v-for="(passenger, index) in passengers" :key="index" class="border rounded-lg p-4">
                  <h3 class="font-medium mb-3">Penumpang {{ index + 1 }} - Kursi {{ selectedSeatNumbers[index] }}</h3>
                  <div class="space-y-3">
                    <div>
                      <Label>Nama Lengkap</Label>
                      <Input v-model="passenger.name" placeholder="Nama sesuai KTP" />
                    </div>
                    <div>
                      <Label>NIK</Label>
                      <Input v-model="passenger.identity_number" placeholder="16 digit NIK" maxlength="16" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="border-t pt-4 space-y-3">
                <h3 class="font-medium">Data Pemesan</h3>
                <div>
                  <Label>Nama Pemesan</Label>
                  <Input v-model="customerName" placeholder="Nama lengkap" />
                </div>
                <div>
                  <Label>No. Telepon</Label>
                  <Input v-model="customerPhone" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <Label>Email (Opsional)</Label>
                  <Input v-model="customerEmail" type="email" placeholder="email@example.com" />
                </div>
              </div>

              <div class="flex gap-2">
                <Button @click="bookTicket" :disabled="store.loading">
                  {{ store.loading ? 'Memproses...' : 'Book Sekarang' }}
                </Button>
                <Button variant="outline" @click="showPassengerForm = false">
                  Batal
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <!-- PAYMENT DIALOG -->
          <Dialog v-model:open="showPaymentDialog">
            <DialogContent class="animate-in fade-in zoom-in duration-300">
              <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
              <DialogDescription>Periksa detail transaksi Anda</DialogDescription>
              
              <div v-if="currentTransaction" class="space-y-3 py-4">
                <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span class="text-muted-foreground">Kode Transaksi</span>
                  <span class="font-medium">{{ currentTransaction.trx_code }}</span>
                </div>
                <div class="flex justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <span class="text-muted-foreground font-medium">Total Bayar</span>
                  <span class="font-bold text-2xl text-primary">Rp {{ currentTransaction.amount?.toLocaleString('id-ID') }}</span>
                </div>
                <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span class="text-muted-foreground">Status</span>
                  <span class="font-medium px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">{{ currentTransaction.status }}</span>
                </div>
              </div>

              <div class="flex gap-2">
                <Button @click="payTransaction" :disabled="store.loading" class="flex-1 transition-all hover:scale-105">
                  {{ store.loading ? 'Memproses...' : 'Bayar Sekarang' }}
                </Button>
                <Button variant="destructive" @click="cancelTransaction" class="transition-all hover:scale-105">
                  Batalkan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <!-- ISSUE DIALOG -->
          <Dialog v-model:open="showIssueDialog">
            <DialogContent class="max-w-2xl animate-in fade-in zoom-in duration-300">
              <DialogTitle>Informasi Tiket</DialogTitle>
              <DialogDescription>Detail tiket bus Anda</DialogDescription>
              
              <div v-if="currentTransaction" class="space-y-4 py-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <span class="text-sm text-muted-foreground block mb-1">Kode Transaksi</span>
                    <p class="font-medium">{{ currentTransaction.trx_code }}</p>
                  </div>
                  <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                    <span class="text-sm text-muted-foreground block mb-1">Status</span>
                    <p class="font-medium text-green-600">{{ currentTransaction.status }}</p>
                  </div>
                  <div class="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <span class="text-sm text-muted-foreground block mb-1">Rute</span>
                    <p class="font-medium">{{ selectedSchedule?.vehicle?.name || 'Bus' }}</p>
                  </div>
                  <div class="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <span class="text-sm text-muted-foreground block mb-1">Tanggal Keberangkatan</span>
                    <p class="font-medium">{{ travel_date }}</p>
                  </div>
                  <div class="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <span class="text-sm text-muted-foreground block mb-1">Jam Keberangkatan</span>
                    <p class="font-medium">{{ selectedSchedule?.departure_time }}</p>
                  </div>
                  <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span class="text-sm text-muted-foreground block mb-1">Kursi</span>
                    <p class="font-medium text-blue-700">{{ selectedSeatNumbers.join(', ') }}</p>
                  </div>
                </div>

                <div class="border-t pt-4">
                  <h3 class="font-medium mb-3 flex items-center gap-2">Penumpang</h3>
                  <div class="space-y-2">
                    <div v-for="(passenger, index) in passengers" :key="index" class="text-sm p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <span class="font-medium">{{ index + 1 }}. {{ passenger.name }}</span>
                      <span class="text-muted-foreground ml-2">({{ passenger.identity_number }})</span>
                    </div>
                  </div>
                </div>

                <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 animate-pulse">
                  <p class="text-sm text-green-700 font-medium">Pembayaran berhasil! Klik tombol di bawah untuk mencetak tiket dan mendapatkan fee.</p>
                </div>
              </div>

              <div class="flex gap-2">
                <Button @click="issueTicket" :disabled="store.loading" class="flex-1 transition-all hover:scale-105">
                  {{ store.loading ? 'Memproses...' : 'Cetak Tiket' }}
                </Button>
                <Button variant="outline" @click="showIssueDialog = false" class="transition-all hover:scale-105">
                  ← Kembali
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <!-- PRINT TICKET DIALOG -->
          <Dialog v-model:open="showPrintDialog">
            <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
              <TicketPrint v-if="selectedTicket" :ticket="selectedTicket" />
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
