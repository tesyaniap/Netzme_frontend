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
        <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
          <!-- Page Header -->
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Mitra</h1>
            <p class="text-muted-foreground mt-1 text-sm sm:text-base">
              Ringkasan aktivitas dan saldo mitra Anda.
            </p>
          </div>

          <!-- Error Alert -->
          <div v-if="dashboardStore.error" class="rounded-lg border border-destructive/50 bg-destructive/10 p-3 sm:p-4">
            <p class="text-sm text-destructive font-medium">{{ dashboardStore.error }}</p>
            <p class="text-xs text-muted-foreground mt-1">Silakan hubungi admin untuk aktivasi akun mitra Anda.</p>
          </div>

          <!-- Stats Cards -->
          <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-xs sm:text-sm font-medium">Saldo Deposit</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-xl sm:text-2xl font-bold">
                  Rp {{ dashboardStore.dashboard.balance.toLocaleString('id-ID') }}
                </div>

                <p class="text-xs text-muted-foreground">
                  Note : Saldo Aktif Saat ini 
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-xs sm:text-sm font-medium">Total Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-xl sm:text-2xl font-bold">
                  {{ dashboardStore.dashboard.totalTransactions }}
                </div>

                <p class="text-xs text-muted-foreground">
                  Transaksi Bulan Ini 
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-xs sm:text-sm font-medium">Total Fee Diperoleh</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-xl sm:text-2xl font-bold">
                      Rp {{ dashboardStore.dashboard.totalFee.toLocaleString('id-ID') }}
                </div>

                <p class="text-xs text-muted-foreground">
                  Note : Akumulasi Fee
                </p>
              </CardContent>
            </Card>
          </div>

          <!-- Grafik Transaksi Mitra -->
          <Card>
            <CardHeader>
              <CardTitle>Grafik Transaksi Mitra</CardTitle>
              <CardDescription>
                Ringkasan transaksi mitra berdasarkan waktu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionChart :chartData="dashboardStore.dashboard.chart" />
            </CardContent>
          </Card>

        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import SiteHeader from '@/components/SiteHeader.vue'
import SidebarMitra from '@/components/SidebarMitra.vue'
import TransactionChart from '@/components/TransactionChart.vue'

import { useDashboardMitraStore } from '@/stores/mitra/dashboard'
import { onMounted } from 'vue'

const dashboardStore = useDashboardMitraStore()

onMounted(() => {
  dashboardStore.fetchDashboard()
})


const router = useRouter()

</script>

