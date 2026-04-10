<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col">
      <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p class="text-muted-foreground mt-1 text-sm sm:text-base">Overview statistik dan aktivitas sistem</p>
        </div>

          <div v-if="loading" class="flex items-center justify-center py-8">
            <p class="text-muted-foreground">Loading...</p>
          </div>

          <div v-else-if="dashboardData" class="space-y-4 sm:space-y-6">
            <!-- Stats Cards -->
            <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-xs sm:text-sm font-medium">Transaksi Hari Ini</CardTitle>
                  <CreditCard class="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-xl sm:text-2xl font-bold">{{ dashboardData.total_transactions_today || 0 }}</div>
                  <p class="text-xs text-muted-foreground">Transaksi hari ini</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-xs sm:text-sm font-medium">Transaksi Bulan Ini</CardTitle>
                  <TrendingUp class="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-xl sm:text-2xl font-bold">{{ dashboardData.total_transactions_month || 0 }}</div>
                  <p class="text-xs text-muted-foreground">Transaksi bulan ini</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-xs sm:text-sm font-medium">Total Saldo Mitra</CardTitle>
                  <Wallet class="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-xl sm:text-2xl font-bold">{{ formatCurrency(balance) }}</div>
                  <p class="text-xs text-muted-foreground">Saldo semua mitra</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-xs sm:text-sm font-medium">Total Deposit Masuk</CardTitle>
                  <TrendingUp class="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-xl sm:text-2xl font-bold">{{ formatCurrency(dashboardData.total_deposit || 0) }}</div>
                  <p class="text-xs text-muted-foreground">Total deposit</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle class="text-xs sm:text-sm font-medium">Total Fee Mitra</CardTitle>
                  <DollarSign class="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div class="text-xl sm:text-2xl font-bold">{{ formatCurrency(dashboardData.total_fee_mitra || 0) }}</div>
                  <p class="text-xs text-muted-foreground">Total fee mitra</p>
                </CardContent>
              </Card>
            </div>

            <!-- Transaction Chart -->
            <Card>
              <CardHeader>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <CardDescription>Daftar transaksi terkini</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div v-if="!dashboardData.chart_transactions?.length" class="text-sm text-muted-foreground text-center py-4">
                    Belum ada transaksi
                  </div>
                  <div v-for="trx in dashboardData.chart_transactions" :key="trx.id" class="flex items-center justify-between border-b pb-3 last:border-0">
                    <div class="flex-1">
                      <p class="text-sm font-medium">{{ trx.trx_code }}</p>
                      <p class="text-xs text-muted-foreground">{{ trx.route }} • {{ formatDateTime(trx.created_at) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">{{ formatCurrency(parseFloat(trx.amount)) }}</p>
                      <Badge :variant="getStatusVariant(trx.status)" class="text-xs">{{ trx.status }}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Recent Activities -->
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>Aktivitas sistem terkini</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div v-if="!dashboardData.recent_activities?.length" class="text-sm text-muted-foreground text-center py-4">
                    Belum ada aktivitas
                  </div>
                  <div v-for="activity in dashboardData.recent_activities" :key="activity.id" class="flex items-center justify-between border-b pb-3 last:border-0">
                    <div class="flex-1">
                      <p class="text-sm font-medium">{{ activity.trx_code }}</p>
                      <p class="text-xs text-muted-foreground">{{ activity.route }} • {{ formatDateTime(activity.created_at) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">{{ formatCurrency(parseFloat(activity.amount)) }}</p>
                      <Badge :variant="getStatusVariant(activity.status)" class="text-xs">{{ activity.status }}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { CreditCard, DollarSign, Wallet, TrendingUp } from 'lucide-vue-next'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()

const loading = ref(false)
const dashboardData = ref<any>(null)
const balance = ref<number>(0)

onMounted(() => {
  toast({ title: 'Selamat Datang', description: 'Dashboard admin berhasil dimuat' })
  fetchDashboardData()
  fetchBalance()
})

const fetchDashboardData = async () => {
  loading.value = true
  const loadingToast = toast({ 
    title: 'Memuat Dashboard...', 
    description: 'Sedang mengambil data statistik', 
    duration: 0 
  })
  
  try {
    const response = await api.get('/dashboard/admin')
    dashboardData.value = response.data.data
    loadingToast.dismiss()
    
    if (dashboardData.value) {
      const totalTransactions = dashboardData.value.total_transactions_today || 0
      toast({ title: 'Dashboard Siap', description: `${totalTransactions} transaksi hari ini` })
    }
  } catch (error) {
    loadingToast.dismiss()
    console.error('Failed to fetch dashboard data:', error)
    toast({ title: 'Error', description: 'Gagal memuat data dashboard', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const fetchBalance = async () => {
  try {
    const response = await api.get('/balance')
    balance.value = response.data.data?.total_balance || 0
  } catch (error) {
    console.error('Failed to fetch balance:', error)
    toast({ title: 'Warning', description: 'Gagal memuat data saldo', variant: 'destructive' })
  }
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusVariant = (status: string) => {
  const statusLower = status.toLowerCase()
  if (statusLower === 'success' || statusLower === 'approved') return 'default'
  if (statusLower === 'pending') return 'secondary'
  if (statusLower === 'failed' || statusLower === 'rejected') return 'destructive'
  return 'outline'
}
</script>