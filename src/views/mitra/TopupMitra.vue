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

          <!-- Page Header -->
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Top Up Saldo</h1>
            <p class="text-muted-foreground mt-1">
              Ajukan penambahan saldo deposit mitra.
            </p>
          </div>

          <!-- Saldo -->
          <Card>
            <CardHeader>
              <CardTitle>Saldo Saat Ini</CardTitle>
              <CardDescription>Saldo deposit aktif</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">
                Rp {{ dashboardStore.dashboard.balance.toLocaleString('id-ID') }}
              </div>
            </CardContent>
          </Card>

          <!-- Form Top Up -->
          <Card>
            <CardHeader>
              <CardTitle>Form Top Up</CardTitle>
              <CardDescription>
                Masukkan nominal dan metode pembayaran
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">

              <input
                type="number"
                min="10000"
                v-model="amount"
                placeholder="Nominal Top Up"
                class="w-full rounded-md border px-3 py-2 text-sm"
              />

              <select
                v-model="paymentMethod"
                class="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="transfer">Transfer Bank</option>
                <option value="va">Virtual Account</option>
                <option value="ewallet">E-Wallet</option>
              </select>

              <input type="file" @change="onFileChange" />


              <Button
                :disabled="topupStore.loading"
                @click="submitTopup"
              >
                {{ topupStore.loading ? 'Mengirim...' : 'Ajukan Top Up' }}
              </Button>

            </CardContent>
          </Card>

          <!-- Riwayat Top Up -->
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Top Up</CardTitle>
              <CardDescription>
                Daftar pengajuan top up saldo
              </CardDescription>
            </CardHeader>
            <CardContent>

              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="py-2 text-left">Tanggal</th>
                    <th class="text-left">Nominal</th>
                    <th class="text-left">Metode</th>
                    <th class="text-left">Status</th>
                    <th class="text-left">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="topup in topupStore.topups" :key="topup.id">

                    <td class="py-2">
                      {{ new Date(topup.created_at).toLocaleDateString('id-ID') }}
                    </td>
                    <td>
                      Rp {{ Number(topup.amount).toLocaleString('id-ID') }}
                    </td>
                    <td>{{ topup.payment_method }}</td>
                    <td>
                      <span
                        :class="{
                          'text-yellow-600': topup.status === 'pending',
                          'text-green-600': topup.status === 'success',
                          'text-red-600': topup.status === 'rejected',
                        }"
                      >
                        {{ topup.status }}
                      </span>
                    </td>
                    <td>
                      <Button size="sm" variant="outline" class="h-7 text-xs" @click="openDetail(topup)">Detail</Button>
                    </td>
                  </tr>

                  <tr v-if="!topupStore.topups || topupStore.topups.length === 0">
                    <td colspan="5" class="py-4 text-center text-muted-foreground">Belum ada data top up</td>
                  </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div v-if="topupStore.topups.length > 0" class="flex items-center justify-between mt-4 pt-4 border-t">
                <div class="text-sm text-muted-foreground">
                  Menampilkan {{ topupStore.topups.length }} dari {{ topupStore.pagination.total }} data
                  (Halaman {{ topupStore.pagination.current_page }} dari {{ topupStore.pagination.last_page }})
                </div>
                <div v-if="topupStore.pagination.last_page > 1" class="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="topupStore.pagination.current_page === 1"
                    @click="changePage(topupStore.pagination.current_page - 1)"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="topupStore.pagination.current_page === topupStore.pagination.last_page"
                    @click="changePage(topupStore.pagination.current_page + 1)"
                  >
                    Next
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </SidebarInset>

    <!-- Detail Dialog -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-md">
        <DialogTitle>Detail Top Up</DialogTitle>
        <DialogDescription>Informasi permintaan top up</DialogDescription>
        <div v-if="selectedTopup" class="space-y-3 py-2">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-muted-foreground">Tanggal</p>
              <p class="font-medium">{{ new Date(selectedTopup.created_at).toLocaleDateString('id-ID') }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Nominal</p>
              <p class="font-medium">Rp {{ Number(selectedTopup.amount).toLocaleString('id-ID') }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Metode</p>
              <p class="font-medium">{{ selectedTopup.payment_method }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Status</p>
              <span :class="{
                'text-yellow-600 font-medium': selectedTopup.status === 'pending',
                'text-green-600 font-medium': selectedTopup.status === 'success',
                'text-red-600 font-medium': selectedTopup.status === 'rejected',
              }">{{ selectedTopup.status }}</span>
            </div>
          </div>

          <div v-if="selectedTopup.status === 'rejected' && (selectedTopup.reject_reason || selectedTopup.rejection_reason)"
            class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-1">
            <p class="text-xs font-semibold text-destructive">Alasan Penolakan</p>
            <p class="text-sm text-destructive">{{ selectedTopup.reject_reason || selectedTopup.rejection_reason }}</p>
          </div>
        </div>
        <div class="flex justify-end pt-2">
          <Button variant="outline" @click="showDetailDialog = false">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import SiteHeader from '@/components/SiteHeader.vue'
import SidebarMitra from '@/components/SidebarMitra.vue'
import { useDashboardMitraStore } from '@/stores/mitra/dashboard'
import { useAuthStore } from "@/stores/auth.store"
import { useMitraTopupStore } from '@/stores/mitra/topup.store'
import { useToast } from '@/components/ui/toast/use-toast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const topupStore = useMitraTopupStore()
const dashboardStore = useDashboardMitraStore()
const { toast } = useToast()

const amount = ref<number | null>(null)
const paymentMethod = ref('transfer')
const proofFile = ref<File | null>(null)
const showDetailDialog = ref(false)
const selectedTopup = ref<any>(null)

const openDetail = (topup: any) => {
  selectedTopup.value = topup
  showDetailDialog.value = true
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target || !target.files || target.files.length === 0) return
  proofFile.value = target.files[0]
}

const changePage = (page: number) => {
  router.push({ query: { page } })
  topupStore.fetchTopups(page)
}

const submitTopup = async () => {
  if (!amount.value) {
    toast({
      title: 'Error',
      description: 'Nominal top up harus diisi',
      variant: 'destructive'
    })
    return
  }

  if (!proofFile.value) {
    toast({
      title: 'Error',
      description: 'Bukti transfer harus diupload',
      variant: 'destructive'
    })
    return
  }

  try {
    const form = new FormData()
    form.append('amount', amount.value.toString())
    form.append('payment_method', paymentMethod.value)
    form.append('proof_file', proofFile.value)

    await topupStore.createTopup(form)
    
    toast({
      title: 'Berhasil',
      description: 'Pengajuan top up berhasil dikirim',
    })

    // Reset form
    amount.value = null
    proofFile.value = null
    paymentMethod.value = 'transfer'

    // Refresh data
    const currentPage = Number(route.query.page) || 1
    await topupStore.fetchTopups(currentPage)
    await dashboardStore.fetchDashboard()
  } catch (error: any) {
    toast({
      title: 'Gagal',
      description: error.message || 'Gagal mengajukan top up',
      variant: 'destructive'
    })
  }
}

onMounted(() => {
  const page = Number(route.query.page) || 1
  dashboardStore.fetchDashboard()
  topupStore.fetchTopups(page, 10)
})
</script>
