<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />

      <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Manajemen Tiket</h1>
          <p class="text-muted-foreground mt-1">Daftar e-tiket yang sudah diterbitkan (issued)</p>
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
                      <Badge class="bg-green-100 text-green-800 border-green-300">Issued</Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex justify-end gap-2">
                        <Button size="sm" variant="outline" @click="viewDetail(ticket)">Detail</Button>
                        <Button size="sm" @click="printTicket(ticket)">
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
                  <Button size="sm" variant="outline" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Previous</Button>
                  <Button size="sm" variant="outline" :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)">Next</Button>
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
              <p class="font-medium">{{ selectedTicket.passenger?.name }}</p>
              <p class="text-sm text-muted-foreground">{{ selectedTicket.passenger?.phone }}</p>
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
import { ref, onMounted } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Printer } from 'lucide-vue-next'
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

onMounted(() => fetchTickets())

const fetchTickets = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      status: 'issued',
      page: currentPage.value,
      per_page: 10,
    }
    if (dateFilter.value) params.travel_date = dateFilter.value

    const response = await api.get('/reports/transactions', { params })
    const res = response.data

    // Map each transaction + its tickets into flat rows
    const rows: any[] = []
    for (const trx of res.data ?? []) {
      try {
        const trxDetail = await api.get(`/transactions/${trx.trx_code}`)
        const detail = trxDetail.data.data ?? trxDetail.data
        // response structure: { transaction: {}, schedule: {}, tickets: [], passengers: [] }
        const transaction = detail.transaction ?? {}
        const schedule = detail.schedule ?? {}
        const ticketList = detail.tickets ?? []
        const passengerList = detail.passengers ?? []
        const seats = ticketList.map((t: any) => t.seat?.seat_number).filter(Boolean)
        const route = schedule.route ?? {}

        rows.push({
          id: trx.id,
          trx_code: trx.trx_code,
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
      } catch {
        rows.push({
          id: trx.id,
          trx_code: trx.trx_code,
          customer_name: trx.mitra ?? '-',
          customer_phone: '-',
          passengers: [],
          route: '-',
          vehicle: '-',
          travel_date: trx.tanggal,
          seats: ['—'],
          ticket_ids: [],
        })
      }
    }

    // Filter by search query client-side
    tickets.value = searchQuery.value
      ? rows.filter(r =>
          r.trx_code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          r.customer_name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      : rows

    lastPage.value = res.last_page ?? 1
    total.value = res.total ?? rows.length
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
    toast({ title: 'Error', description: 'Gagal memuat data tiket', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchTickets()
}

const viewDetail = async (ticket: any) => {
  if (!ticket.ticket_ids?.length) {
    toast({ title: 'Info', description: 'Tidak ada data tiket detail', variant: 'destructive' })
    return
  }
  showDetailDialog.value = true
  loadingDetail.value = true
  currentPrintTicketId.value = ticket.ticket_ids[0]
  selectedDetailPassengers.value = ticket.passengers ?? []
  try {
    const response = await api.get(`/tickets/${ticket.ticket_ids[0]}/data`)
    selectedTicket.value = response.data.data
  } catch (error) {
    toast({ title: 'Error', description: 'Gagal memuat detail tiket', variant: 'destructive' })
  } finally {
    loadingDetail.value = false
  }
}

const printTicket = async (ticket: any) => {
  if (!ticket.ticket_ids?.length) {
    toast({ title: 'Info', description: 'Tidak ada data tiket untuk dicetak', variant: 'destructive' })
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
    toast({ title: 'Error', description: 'Gagal memuat data cetak tiket', variant: 'destructive' })
    showPrintDialog.value = false
  } finally {
    loadingPrint.value = false
  }
}

const doPrint = () => {
  const printArea = document.getElementById('print-area')
  if (!printArea) return
  const win = window.open('', '_blank')
  if (!win) return
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
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>