<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight">Manajemen User</h1>
              <p class="text-muted-foreground mt-1">Kelola user dan role sistem</p>
            </div>
            <Button @click="showAddDialog = true">
              <Plus class="h-4 w-4 mr-2" />
              Tambah User
            </Button>
          </div>

          <div v-if="userStore.loading" class="flex items-center justify-center py-8">
            <p class="text-muted-foreground">Loading...</p>
          </div>

          <Card v-else>
            <CardHeader>
              <CardTitle>Daftar User</CardTitle>
              <CardDescription>Semua user yang terdaftar dalam sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Instansi</TableHead>
                    <TableHead>Bergabung</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="user in userStore.users" :key="user.id">
                    <TableCell class="font-medium">{{ user.name }}</TableCell>
                    <TableCell>{{ user.email }}</TableCell>
                    <TableCell>
                      <Badge :class="getRoleBadgeClass(user.role)">
                        <BadgeCheck v-if="user.role === 'admin'" class="h-3 w-3 mr-1" />
                        <Bus v-if="user.role === 'mitra'" class="h-3 w-3 mr-1" />
                        {{ user.role || '-' }}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span v-if="user.mitra" class="text-sm text-muted-foreground">{{ user.mitra.name }}</span>
                      <span v-else class="text-sm text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell>{{ formatDate(user.created_at) }}</TableCell>
                    <TableCell>
                      <div class="flex gap-2">
                        <Button size="sm" variant="outline" @click="editUser(user)">
                          <Edit class="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" @click="deleteUser(user)">
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <!-- Add User Dialog -->
          <Dialog v-model:open="showAddDialog">
            <DialogContent>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <form @submit.prevent="handleAddUser" class="space-y-4">
                <div>
                  <Label for="nama">Nama</Label>
                  <Input id="nama" v-model="formData.nama" required />
                </div>
                <div>
                  <Label for="email">Email</Label>
                  <Input id="email" v-model="formData.email" type="email" required />
                </div>
                <div>
                  <Label for="role">Role</Label>
                  <Select v-model="formData.role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="mitra">Mitra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="formData.role === 'mitra'">
                  <Label for="instansi">Instansi</Label>
                  <Input id="instansi" v-model="formData.instansi" placeholder="Nama perusahaan shuttle" required />
                </div>
                <div>
                  <Label for="password">Password</Label>
                  <Input id="password" v-model="formData.password" type="password" required />
                </div>
                <div class="flex gap-2 pt-4">
                  <Button type="submit" :disabled="userStore.loading">
                    {{ userStore.loading ? 'Menyimpan...' : 'Simpan' }}
                  </Button>
                  <Button type="button" variant="outline" @click="showAddDialog = false">
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <!-- Edit User Dialog -->
          <Dialog v-model:open="showEditDialog">
            <DialogContent>
              <DialogTitle>Edit User</DialogTitle>
              <form @submit.prevent="handleEditUser" class="space-y-4">
                <div>
                  <Label for="edit-nama">Nama</Label>
                  <Input id="edit-nama" v-model="formData.nama" required />
                </div>
                <div>
                  <Label for="edit-email">Email</Label>
                  <Input id="edit-email" v-model="formData.email" type="email" required />
                </div>
                <div>
                  <Label for="edit-role">Role</Label>
                  <Select v-model="formData.role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="mitra">Mitra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="formData.role === 'mitra'">
                  <Label for="edit-instansi">Instansi</Label>
                  <Input id="edit-instansi" v-model="formData.instansi" placeholder="Nama perusahaan shuttle" />
                </div>
                <div>
                  <Label for="edit-password">Password (kosongkan jika tidak diubah)</Label>
                  <Input id="edit-password" v-model="formData.password" type="password" />
                </div>
                <div class="flex gap-2 pt-4">
                  <Button type="submit" :disabled="userStore.loading">
                    {{ userStore.loading ? 'Menyimpan...' : 'Simpan' }}
                  </Button>
                  <Button type="button" variant="outline" @click="showEditDialog = false">
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { Plus, Edit, BadgeCheck, Bus } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user.store'
import type { User, UserFormData } from '@/types/user.types'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()

const userStore = useUserStore()
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingUser = ref<User | null>(null)
const formData = ref<UserFormData>({
  nama: '',
  email: '',
  role: '',
  instansi: '',
  password: ''
})

onMounted(() => {
  userStore.fetchUsers()
})

const handleAddUser = async () => {
  try {
    await userStore.createUser(formData.value)
    showAddDialog.value = false
    formData.value = { nama: '', email: '', role: '', instansi: '', password: '' }
    toast({
      title: 'Berhasil',
      description: 'User berhasil ditambahkan',
    })
  } catch (error) {
    toast({
      title: 'Gagal',
      description: 'Gagal menambahkan user',
      variant: 'destructive',
    })
  }
}

const editUser = (user: User) => {
  editingUser.value = user
  formData.value = {
    nama: user.name,
    email: user.email,
    role: user.role || '',
    instansi: user.mitra?.name || '',
    password: ''
  }
  showEditDialog.value = true
}

const handleEditUser = async () => {
  if (!editingUser.value) return
  try {
    await userStore.updateUser(editingUser.value.id, formData.value)
    showEditDialog.value = false
    formData.value = { nama: '', email: '', role: '', instansi: '', password: '' }
    editingUser.value = null
    toast({ title: 'Berhasil', description: 'User berhasil diperbarui' })
  } catch (error) {
    toast({ title: 'Gagal memperbarui user', variant: 'destructive' })
  }
}

const deleteUser = async (user: User) => {
  if (!confirm(`Hapus user ${user.name}?`)) return
  try {
    await userStore.deleteUser(user.id)
    toast({
      title: 'Berhasil',
      description: 'User berhasil dihapus',
    })
  } catch (error) {
    toast({
      title: 'Gagal',
      description: 'Gagal menghapus user',
      variant: 'destructive',
    })
  }
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900'
    case 'mitra': return 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900'
    default: return 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>