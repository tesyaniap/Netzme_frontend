<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Search, LogOut, Settings, HelpCircle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const getUserInitials = () => {
  const name = authStore.user?.name || 'User'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const currentPageName = computed(() => {
  const path = route.path
  if (path === '/dashboard') return 'Dashboard'
  if (path === '/products') return 'Products'
  return 'Page'
})
</script>

<template>
  <header class="sticky top-0 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
    <div class="flex items-center gap-1 sm:gap-2 flex-1">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-1 sm:mr-2 h-4" />
      <Breadcrumb class="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/mitra/dashboard">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{{ currentPageName }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <!-- Mobile page title -->
      <div class="sm:hidden text-sm font-medium truncate">
        {{ currentPageName }}
      </div>
    </div>
    
    <div class="flex items-center gap-1 sm:gap-2">
      <button
        class="hidden sm:flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        aria-label="Search"
      >
        <Search class="h-4 w-4" />
      </button>
      
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="flex items-center gap-1 sm:gap-2 rounded-md hover:bg-accent px-1 sm:px-2 py-1">
            <Avatar class="h-7 w-7 sm:h-8 sm:w-8">
              <AvatarFallback class="text-xs">
                {{ getUserInitials() }}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel>
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium leading-none">{{ authStore.user?.name }}</p>
              <p class="text-xs leading-none text-muted-foreground">
                {{ authStore.user?.email || 'user@example.com' }}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings class="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HelpCircle class="mr-2 h-4 w-4" />
            <span>Get Help</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
