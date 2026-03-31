<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Home, Users, Bus, User, Shield, FileText, Wallet, MapPin, Calendar, Ticket, Car } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const navigationItems = [
  {
    title: 'Dashboard',
    icon: Home,
    path: '/admin/dashboard',
  },
  {
    title: 'Data Mitra',
    icon: Users,
    path: '/admin/mitra',
  },
  {
    title: 'Approval Top Up',
    icon: Wallet,
    path: '/admin/topup-approval',
  },
  {
    title: 'Data Pengguna',
    icon: User,
    path: '/admin/users',
  },
  {
    title: 'Role Management',
    icon: Shield,
    path: '/admin/role-management',
  },
  {
    title: 'Manajemen Lokasi',
    icon: MapPin,
    path: '/admin/locations',
  },
  {
    title: 'Manajemen Kendaraan',
    icon: Car,
    path: '/admin/vehicles',
  },
  {
    title: 'Manajemen Jadwal',
    icon: Calendar,
    path: '/admin/schedules',
  },
  {
    title: 'Manajemen Tiket',
    icon: Ticket,
    path: '/admin/tickets',
  },
  {
    title: 'Laporan',
    icon: FileText,
    path: '/admin/reports',
  },
]

const getUserInitials = () => {
  const name = authStore.user?.name || 'User'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <div class="flex items-center gap-2">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Bus class="size-4" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold">H2H Ticketing</span>
                <span class="text-xs">Admin Dashboard</span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navigationItems" :key="item.path">
              <SidebarMenuButton
                :is-active="route.path === item.path"
                as-child
              >
                <a :href="item.path" @click.prevent="router.push(item.path)">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div class="flex items-center gap-2">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <span class="text-sm font-semibold">{{ getUserInitials() }}</span>
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="text-sm font-medium">{{ authStore.user?.name || 'User' }}</span>
                <span class="text-xs text-muted-foreground">{{ authStore.user?.email || 'user@example.com' }}</span>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    
    <SidebarRail />
  </Sidebar>
</template>
