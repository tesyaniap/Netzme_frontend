<template>
  <SidebarProvider :style="{ '--sidebar-width': '16rem', '--header-height': '3rem' }">
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Role Management</h1>
            <p class="text-muted-foreground mt-1">Kelola role dan permission sistem</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="loading" class="text-center py-8">Loading...</div>
              
              <Table v-else>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Role</TableHead>
                    <TableHead>Jumlah Permission</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="role in roles" :key="role.id">
                    <TableCell class="font-medium">{{ role.name }}</TableCell>
                    <TableCell>{{ role.permissions?.length || 0 }} permissions</TableCell>
                    <TableCell class="text-right">
                      <Button size="sm" variant="outline" @click="openPermissionDialog(role)">
                        Kelola Permission
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>

    <!-- Permission Dialog -->
    <Dialog v-model:open="showPermissionDialog">
      <DialogContent class="max-w-2xl p-0 flex flex-col max-h-[80vh]">
        <div class="p-6 pb-4">
          <DialogTitle>Kelola Permission - {{ selectedRole?.name }}</DialogTitle>
          <DialogDescription>Pilih permission untuk role ini</DialogDescription>
        </div>
        <div class="flex-1 overflow-y-auto px-6 pb-6">
          <div class="space-y-2">
            <div v-for="(permissions, category) in groupedPermissions" :key="category" class="border rounded-lg">
              <button
                @click="toggleCategory(category)"
                class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform"
                    :class="expandedCategories.has(category) ? 'rotate-90' : ''"
                  >
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                  <h3 class="text-sm font-semibold uppercase tracking-wider">
                    {{ categoryLabels[category] || category }}
                  </h3>
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ permissions.filter(p => isPermissionActive(p.id)).length }} / {{ permissions.length }}
                </span>
              </button>
              <div v-if="expandedCategories.has(category)" class="p-4 pt-0 space-y-2">
                <div v-for="permission in permissions" :key="permission.id" class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div class="flex-1">
                    <p class="font-medium text-sm">{{ permission.name }}</p>
                    <p v-if="permission.description" class="text-xs text-muted-foreground">{{ permission.description }}</p>
                  </div>
                  <Switch
                    :model-value="isPermissionActive(permission.id)"
                    @update:model-value="checked => togglePermission(permission.id, checked)"
                    class="ml-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-2 p-6 pt-4 border-t bg-background">
          <Button @click="savePermissions" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </Button>
          <Button variant="outline" @click="showPermissionDialog = false">
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { api } from '@/services/api.service'
import { useToast } from '@/components/ui/toast'

const { toast } = useToast()
const loading = ref(false)
const saving = ref(false)
const roles = ref<any[]>([])
const allPermissions = ref<any[]>([])
const selectedRole = ref<any | null>(null)
const selectedPermissions = ref<string[]>([])
const showPermissionDialog = ref(false)
const expandedCategories = ref<Set<string>>(new Set())

const groupedPermissions = computed(() => {
  const groups: Record<string, any[]> = {}
  allPermissions.value.forEach(permission => {
    // Validasi permission dan permission.name
    if (!permission || typeof permission.name !== 'string' || !permission.name) {
      console.warn('Invalid permission object:', permission)
      return
    }
    const category = permission.name.split('.')[0]
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(permission)
  })
  return groups
})

const categoryLabels: Record<string, string> = {
  users: 'User Management',
  roles: 'Role & Permission',
  permissions: 'Permission Management',
  mitra: 'Mitra Management',
  transactions: 'Transaksi',
  reports: 'Laporan',
  topups: 'Top Up',
  balance: 'Balance & Saldo',
  'fee-ledgers': 'Fee Ledger',
  routes: 'Manajemen Rute',
  cities: 'Manajemen Kota',
  terminals: 'Manajemen Terminal',
  schedules: 'Manajemen Jadwal',
  vehicles: 'Manajemen Kendaraan',
  seats: 'Manajemen Kursi',
  tickets: 'Manajemen Tiket',
  locations: 'Manajemen Lokasi',
  dashboard: 'Dashboard'
}

onMounted(() => {
  fetchRoles()
  fetchAllPermissions()
})

const fetchRoles = async () => {
  loading.value = true
  try {
    const response = await api.get('/roles')
    roles.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch roles:', error)
  } finally {
    loading.value = false
  }
}

const fetchAllPermissions = async () => {
  try {
    const response = await api.get('/permissions')
    console.log('Permissions response:', response.data)
    
    // Backend returns {success: true, data: [{id, name, description}]}
    const data = response.data.data || response.data.message || []
    
    if (Array.isArray(data)) {
      // Backend returns array of objects with {id, name, description}
      allPermissions.value = data
        .filter(item => item && typeof item.name === 'string' && item.name.trim())
        .map((permission: any) => ({
          id: permission.id || permission.name, // Use ID if available, fallback to name
          name: permission.name.trim(),
          description: permission.description || ''
        }))
    } else {
      console.warn('Permissions data is not an array:', data)
      allPermissions.value = []
    }
    
    console.log('Parsed permissions:', allPermissions.value)
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    allPermissions.value = []
  }
}

const openPermissionDialog = (role: any) => {
  console.log('Opening dialog for role:', role)
  selectedRole.value = role
  const rolePermissions = role.permissions || []
  console.log('Role permissions:', rolePermissions)
  
  // Backend returns array of permission objects with {id, name, description}
  // Extract the IDs for selectedPermissions
  selectedPermissions.value = Array.isArray(rolePermissions) 
    ? rolePermissions.map((p: any) => p.id || p.name || p)
    : []
  
  console.log('Selected permission IDs:', selectedPermissions.value)
  expandedCategories.value = new Set()
  showPermissionDialog.value = true
}

const toggleCategory = (category: string) => {
  if (expandedCategories.value.has(category)) {
    expandedCategories.value.delete(category)
  } else {
    expandedCategories.value.add(category)
  }
}

const isPermissionActive = (id: string) => {
  return selectedPermissions.value.includes(id)
}

const togglePermission = (id: string, checked: boolean) => {
  console.log('Toggle permission:', id, 'checked:', checked)
  if (checked) {
    selectedPermissions.value = [...selectedPermissions.value, id]
  } else {
    selectedPermissions.value = selectedPermissions.value.filter(p => p !== id)
  }
  console.log('Updated selectedPermissions:', selectedPermissions.value)
}

const savePermissions = async () => {
  if (!selectedRole.value) return
  
  saving.value = true
  try {
    console.log('Sending permissions:', selectedPermissions.value)
    // Backend expects array of permission IDs (integers)
    const permissionIds = selectedPermissions.value.map(id => 
      typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id
    )
    
    await api.post(`/roles/${selectedRole.value.id}/permissions`, {
      permissions: permissionIds
    })
    toast({ title: 'Berhasil', description: 'Permission berhasil diperbarui' })
    showPermissionDialog.value = false
    fetchRoles()
  } catch (error: any) {
    console.error('Save permissions error:', error)
    const errorMsg = error.response?.data?.message || error.message || 'Gagal memperbarui permission'
    toast({ title: 'Gagal', description: errorMsg, variant: 'destructive' })
  } finally {
    saving.value = false
  }
}
</script>
