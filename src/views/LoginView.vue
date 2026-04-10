<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
    <div class="w-full max-w-md space-y-6 sm:space-y-8">
      <div class="text-center space-y-2">
        <h1 class="text-2xl sm:text-3xl font-bold">H2H Ticketing</h1>
        <p class="text-muted-foreground text-sm sm:text-base">Masuk ke dashboard admin</p>
      </div>

      <Card>
        <CardContent class="pt-4 sm:pt-6">
          <form @submit.prevent="handleLogin" class="space-y-3 sm:space-y-4">
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="password">Password</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            
            <Button type="submit" class="w-full" :disabled="loading">
              <span v-if="loading">Memproses...</span>
              <span v-else>Masuk</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
        <p>{{ error }}</p>
      </div>
      
      <div class="text-center text-sm text-muted-foreground bg-muted px-4 py-3 rounded-lg">
        <p class="font-medium mb-1">Kredensial Login:</p>
        <p><strong>Email:</strong> admin@example.com</p>
        <p><strong>Password:</strong> password</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'

const router = useRouter()
const authStore = useAuthStore()
const { toast } = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')



const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    toast({
      title: 'Login berhasil!',
      description: 'Selamat datang kembali',
    })

    // 🔥 ROLE-BASED REDIRECT
    if (authStore.user?.role === 'admin') {
      router.push('/admin/dashboard')
    } else if (authStore.user?.role === 'mitra') {
      router.push('/mitra/dashboard')
    } else {
      throw new Error('Role tidak dikenal')
    }

  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      err.message ||
      'Login gagal. Periksa email dan password Anda.'
  } finally {
    loading.value = false
  }
}

</script>
