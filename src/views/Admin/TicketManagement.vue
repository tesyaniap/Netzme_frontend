<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />

      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Manajemen Tiket</h1>
          <p class="text-muted-foreground mt-1">Daftar e-tiket dengan status paid dan issued</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Tiket</CardTitle>
            <CardDescription>{{ total }} tiket ditemukan</CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Search & Filter -->
            <div class="flex flex-col md:flex-row gap-4 mb-6">
              <Input v-model="searchQuery" placeholder="Cari kode transaksi atau nama customer..." class="flex-1" @keyup.enter="fetchTickets" />
              <Input v-model="dateFilter" type="date" class="w-[160px]" @change="fetchTickets" />
              <Button @click="fetchTickets" variant="outline">Cari</Button>
            </div>

            <div v-if="loading" class="text-center py-8">Loading...</div>
            <div v-else-if="tickets.length === 0" class="text-center py-8 text-muted-foreground">
              Tidak ada tiket ditemukan
            </div>
            <div v-else>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Transaksi</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rute</TableHead>
                    <TableHead>Tanggal Travel</TableHead>
                    <TableHead>Kursi</TableHead>
                    <TableHead>Penumpang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="ticket in tickets" :key="ticket.id">
                    <TableCell class="font-medium">{{ ticket.trx_code }}</TableCell>
                    <TableCell>
                      <p class="font-medium">{{ ticket.customer_name }}</p>
                      <p class="text-sm text-muted-foreground">{{ ticket.customer_phone }}</p>
                    </TableCell>
                    <TableCell>
                      <p class="font-medium">{{ ticket.route }}</p>
                      <p class="text-sm text-muted-foreground">{{ ticket.vehicle }}</p>
                    </TableCell>
                    <TableCell>{{ formatDate(ticket.travel_date) }}</TableCell>
                    <TableCell>
                      <div class="flex flex-wrap gap-1">
                        <Badge v-for="seat in ticket.seats" :key="seat" variant="outline">{{ seat }}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div v-if="ticket.passengers?.length" class="space-y-1">
                        <div v-for="p in ticket.passengers" :key="p.id" class="text-sm">
                          <span class="font-medium">{{ p.name }}</span>
                          <span class="text-muted-foreground"> · {{ p.seat_number }}</span>
                        </div>
                      </div>
                      <span v-else class="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        :class="ticket.status === 'issued'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'"
                      >{{ ticket.status === 'issued' ? 'Issued' : 'Paid' }}</Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex justify-end gap-2">
                        <Button size="sm" variant="outline" @click="viewDetail(ticket)">Detail</Button>
                        <Button v-if="ticket.status === 'paid'" size="sm" variant="outline" @click="openReschedule(ticket)">
                          <CalendarClock class="h-4 w-4 mr-1" />
                          Reschedule
                        </Button>
                        <Button v-if="ticket.status === 'issued'" size="sm" @click="printTicket(ticket)">
                          <Printer class="h-4 w-4 mr-1" />
                          Cetak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <!-- Pagination -->
              <div class="flex items-center justify-between pt-4 border-t mt-4">
                <p class="text-sm text-muted-foreground">
                  Halaman {{ currentPage }} dari {{ lastPage }} ({{ total }} tiket)
                </p>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Sebelumnya</Button>
                  <Button size="sm" variant="outline" :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)">Selanjutnya</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>

    <!-- Detail Dialog -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-2xl">
        <DialogTitle>Detail Tiket</DialogTitle>
        <DialogDescription>Informasi lengkap e-tiket</DialogDescription>

        <div v-if="loadingDetail" class="text-center py-8">Loading...</div>
        <div v-else-if="selectedTicket" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p class="text-sm text-muted-foreground">Kode Transaksi</p>
              <p class="font-semibold">{{ selectedTicket.booking_code }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Status</p>
              <Badge class="bg-green-100 text-green-800 border-green-300">Issued</Badge>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Customer</p>
              <p class="font-medium">{{ selectedTicket.passenger?.name ?? selectedTicket.customer_name }}</p>
              <p class="text-sm text-muted-foreground">{{ selectedTicket.passenger?.phone ?? selectedTicket.customer_phone }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Kursi</p>
              <p class="font-medium">{{ selectedTicket.seat?.number }}</p>
            </div>
          </div>

          <!-- Passengers -->
          <div v-if="selectedDetailPassengers?.length" class="p-4 border rounded-lg">
            <p class="font-semibold mb-3">Data Penumpang</p>
            <div class="space-y-2">
              <div v-for="p in selectedDetailPassengers" :key="p.id" class="flex justify-between text-sm p-2 bg-muted/30 rounded">
                <div>
                  <span class="font-medium">{{ p.name }}</span>
                  <span class="text-muted-foreground ml-2">{{ p.identity_number }}</span>
                </div>
                <Badge variant="outline">{{ p.seat_number }}</Badge>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div class="col-span-2 font-semibold">Informasi Perjalanan</div>
            <div>
              <p class="text-sm text-muted-foreground">Rute</p>
              <p class="font-medium">{{ selectedTicket.route?.origin?.city }} → {{ selectedTicket.route?.destination?.city }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Terminal</p>
              <p class="font-medium">{{ selectedTicket.route?.origin?.terminal }} → {{ selectedTicket.route?.destination?.terminal }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Tanggal</p>
              <p class="font-medium">{{ selectedTicket.schedule?.formatted_travel_date }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Jam</p>
              <p class="font-medium">{{ selectedTicket.schedule?.formatted_departure_time }} - {{ selectedTicket.schedule?.formatted_arrival_time }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Kendaraan</p>
              <p class="font-medium">{{ selectedTicket.vehicle?.name }} ({{ selectedTicket.vehicle?.plate_number }})</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Operator</p>
              <p class="font-medium">{{ selectedTicket.operator?.name }}</p>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" @click="showDetailDialog = false">Tutup</Button>
            <Button @click="printFromDetail">
              <Printer class="h-4 w-4 mr-2" />
              Cetak Tiket
            </Button>
          </div>
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
            <div v-for="s in availableSchedules" :key="s.id"
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
            <!-- Seat map per penumpang -->
            <div v-for="(a, idx) in seatAssignments" :key="a.ticket_id" class="p-3 border rounded-lg space-y-2">
              <p class="text-sm font-medium">{{ a.passenger_name }} <span class="text-muted-foreground font-normal">(kursi lama: {{ a.old_seat }})</span></p>
              <!-- Grid layout ala mitra -->
              <div class="bg-gray-50 rounded-lg p-3 border">
                <div class="max-h-[280px] overflow-y-auto">
                  <div class="space-y-2">
                    <div v-for="(rowSeats, rowNum) in seatsByRow" :key="rowNum" class="flex gap-3 justify-center items-center">
                      <!-- Kursi kiri -->
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
                      <!-- Aisle -->
                      <div class="w-6 text-center text-xs text-gray-400 font-medium">{{ rowNum }}</div>
                      <!-- Kursi kanan -->
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
                <!-- Legend -->
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
              <label class="text-sm font-medium">Alasan (opsional)</label>
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

    <!-- Print Preview Dialog -->
    <Dialog v-model:open="showPrintDialog">
      <DialogContent class="max-w-2xl">
        <DialogTitle>Cetak Ulang E-Tiket</DialogTitle>
        <DialogDescription>Preview tiket sebelum dicetak</DialogDescription>

        <div v-if="loadingPrint" class="text-center py-8">Memuat data tiket...</div>
        <div v-else-if="printData" id="print-area" class="space-y-0">
          <!-- Ticket Card -->
          <div class="border-2 border-gray-800 rounded-lg overflow-hidden">
            <!-- Header -->
            <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold">E-TIKET BUS</h2>
                <p class="text-sm opacity-80">{{ printData.operator?.name }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs opacity-70">Kode Booking</p>
                <p class="text-xl font-bold tracking-widest">{{ printData.booking_code }}</p>
              </div>
            </div>

            <!-- Route -->
            <div class="p-4 bg-blue-50 flex items-center justify-between">
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-800">{{ printData.route?.origin?.city }}</p>
                <p class="text-sm text-blue-600">{{ printData.route?.origin?.terminal }}</p>
              </div>
              <div class="text-center text-gray-400">
                <p class="text-2xl">→</p>
                <p class="text-xs">{{ printData.schedule?.formatted_travel_date }}</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-800">{{ printData.route?.destination?.city }}</p>
                <p class="text-sm text-blue-600">{{ printData.route?.destination?.terminal }}</p>
              </div>
            </div>

            <!-- Details -->
            <div class="p-4 grid grid-cols-3 gap-4 border-t">
              <div>
                <p class="text-xs text-gray-500">Penumpang</p>
                <p class="font-semibold">{{ printData.passenger?.name }}</p>
                <p class="text-sm text-gray-600">{{ printData.passenger?.phone }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Keberangkatan</p>
                <p class="font-semibold text-lg">{{ printData.schedule?.formatted_departure_time }}</p>
                <p class="text-sm text-gray-600">{{ printData.schedule?.formatted_travel_date }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Kursi</p>
                <p class="font-semibold text-2xl text-blue-700">{{ printData.seat?.number }}</p>
                <p class="text-sm text-gray-600">{{ printData.seat?.position }}</p>
              </div>
            </div>

            <!-- Vehicle & Price -->
            <div class="p-4 grid grid-cols-2 gap-4 border-t bg-gray-50">
              <div>
                <p class="text-xs text-gray-500">Kendaraan</p>
                <p class="font-medium">{{ printData.vehicle?.name }}</p>
                <p class="text-sm text-gray-600">{{ printData.vehicle?.plate_number }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">Harga Tiket</p>
                <p class="font-bold text-lg">{{ printData.pricing?.formatted_ticket_price }}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="p-3 bg-gray-100 border-t text-center">
              <p class="text-xs text-gray-500">Dicetak ulang pada {{ new Date().toLocaleString('id-ID') }} • Tiket ini sah dan berlaku untuk 1 penumpang</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" @click="showPrintDialog = false">Tutup</Button>
          <Button @click="doPrint">
            <Printer class="h-4 w-4 mr-2" />
            Print
          </Button>
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Printer, CalendarClock } from 'lucide-vue-next'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()

const loading = ref(false)
const loadingDetail = ref(false)
const loadingPrint = ref(false)

const tickets = ref<any[]>([])
const searchQuery = ref('')
const dateFilter = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)

const showDetailDialog = ref(false)
const showPrintDialog = ref(false)
const selectedTicket = ref<any>(null)
const printData = ref<any>(null)
const currentPrintTicketId = ref<number | null>(null)
const selectedDetailPassengers = ref<any[]>([])

onMounted(() => {
  fetchTickets()
})

const fetchTickets = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      status: 'success', // 'success' = paid + issued di ReportController
      page: currentPage.value,
      per_page: 10,
    }
    if (dateFilter.value) params.travel_date = dateFilter.value
    if (searchQuery.value) params.search = searchQuery.value

    // Ambil list transaksi issued
    const response = await api.get('/reports/transactions', { params })
    const res = response.data
    const trxList: any[] = res.data ?? []

    if (trxList.length === 0) {
      tickets.value = []
      lastPage.value = res.last_page ?? 1
      total.value = res.total ?? 0
      return
    }

    // Fetch semua detail sekaligus (parallel, bukan sequential)
    const details = await Promise.all(
      trxList.map((trx: any) =>
        api.get(`/transactions/${trx.trx_code}`)
          .then(r => r.data.data ?? r.data)
          .catch(() => null)
      )
    )

    const rows: any[] = []
    for (let i = 0; i < trxList.length; i++) {
      const trx = trxList[i]
      const detail = details[i]

      if (!detail) {
        rows.push({
          id: trx.id,
          trx_code: trx.trx_code,
          status: trx.status ?? 'issued',
          customer_name: trx.mitra ?? '-',
          customer_phone: '-',
          passengers: [],
          route: '-',
          vehicle: '-',
          travel_date: trx.tanggal,
          seats: ['—'],
          ticket_ids: [],
        })
        continue
      }

      const transaction = detail.transaction ?? {}
      const schedule    = detail.schedule ?? {}
      const ticketList  = detail.tickets ?? []
      const passengerList = detail.passengers ?? []
      const seats = ticketList.length > 0
        ? ticketList.map((t: any) => t.seat?.seat_number).filter(Boolean)
        : passengerList.map((p: any) => p.seat_number).filter(Boolean)
      const route = schedule.route ?? {}

      rows.push({
        id: trx.id,
        trx_code: trx.trx_code,
        status: transaction.status ?? trx.status ?? 'issued',
        customer_name: transaction.customer_name ?? '-',
        customer_phone: transaction.customer_phone ?? '-',
        passengers: passengerList,
        route: route.origin_city && route.destination_city
          ? `${route.origin_city} → ${route.destination_city}`
          : trx.mitra ?? '-',
        vehicle: schedule.vehicle?.name ?? '-',
        travel_date: transaction.travel_date ?? trx.tanggal,
        seats: seats.length > 0 ? seats : ['—'],
        ticket_ids: ticketList.map((t: any) => t.id),
      })
    }

    tickets.value = rows
    lastPage.value = res.last_page ?? 1
    total.value = res.total ?? rows.length
  } catch (error) {
    toast({ title: 'Gagal memuat data tiket', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchTickets()
}

const viewDetail = async (ticket: any) => {
  showDetailDialog.value = true
  loadingDetail.value = true
  selectedDetailPassengers.value = ticket.passengers ?? []

  if (!ticket.ticket_ids?.length) {
    // Transaksi lama tanpa tickets — tampilkan dari data transaksi
    selectedTicket.value = {
      booking_code: ticket.trx_code,
      status: 'issued',
      passenger: { name: ticket.customer_name, phone: ticket.customer_phone },
      seat: { number: ticket.seats?.join(', ') ?? '-' },
      route: {
        origin: { city: ticket.route?.split(' → ')?.[0] ?? '-', terminal: '-' },
        destination: { city: ticket.route?.split(' → ')?.[1] ?? '-', terminal: '-' },
      },
      schedule: null,
      vehicle: { name: ticket.vehicle, plate_number: '' },
      operator: null,
    }
    loadingDetail.value = false
    return
  }

  currentPrintTicketId.value = ticket.ticket_ids[0]
  try {
    const response = await api.get(`/tickets/${ticket.ticket_ids[0]}/data`)
    selectedTicket.value = response.data.data
  } catch {
    toast({ title: 'Gagal memuat detail tiket', variant: 'destructive' })
  } finally {
    loadingDetail.value = false
  }
}

const printTicket = async (ticket: any) => {
  if (!ticket.ticket_ids?.length) {
    toast({ title: 'Tidak ada data tiket', variant: 'destructive' })
    return
  }
  await loadPrintData(ticket.ticket_ids[0])
}

const printFromDetail = async () => {
  if (!currentPrintTicketId.value) return
  showDetailDialog.value = false
  await loadPrintData(currentPrintTicketId.value)
}

const loadPrintData = async (ticketId: number) => {
  showPrintDialog.value = true
  loadingPrint.value = true
  
  try {
    const response = await api.get(`/tickets/${ticketId}/data`)
    printData.value = response.data.data
  } catch (error) {
    toast({ title: 'Gagal memuat data tiket', variant: 'destructive' })
    showPrintDialog.value = false
  } finally {
    loadingPrint.value = false
  }
}

const doPrint = () => {
  const printArea = document.getElementById('print-area')
  if (!printArea) {
    toast({ title: 'Area cetak tidak ditemukan', variant: 'destructive' })
    return
  }
  const win = window.open('', '_blank')
  if (!win) {
    toast({ title: 'Popup diblokir browser', variant: 'destructive' })
    return
  }
  
  win.document.write(`
    <html>
      <head>
        <title>E-Tiket ${printData.value?.booking_code}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>${printArea.innerHTML}</body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
  win.close()
}

const formatDate = (date: string) => {
  if (!date) return '-'
  // Ambil hanya bagian tanggal (YYYY-MM-DD) untuk hindari timezone shift
  const d = date.split('T')[0]
  const [year, month, day] = d.split('-')
  return new Date(+year, +month - 1, +day).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

// ── Reschedule ──────────────────────────────────────────
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

const openReschedule = async (ticket: any) => {
  try {
    const r = await api.get(`/transactions/${ticket.trx_code}`)
    const detail = r.data.data
    const ticketList = detail.tickets ?? []
    const passengerList = detail.passengers ?? []
    if (!ticketList.length) {
      toast({ title: 'Tidak ada tiket untuk transaksi ini', variant: 'destructive' })
      return
    }
    rescheduleData.value = { ...ticket, ticket_ids: ticketList.map((t: any) => t.id) }
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
    // Bangun seats_by_row dari flat list
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
    fetchTickets()
  } catch (err: any) {
    toast({ title: 'Gagal reschedule', description: err.message, variant: 'destructive' })
  } finally {
    submittingReschedule.value = false
  }
}
</script>