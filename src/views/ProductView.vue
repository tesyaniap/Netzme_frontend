<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '16rem',
      '--header-height': '3rem',
    }"
  >
    <AppSidebar />
    <SidebarInset>
      <SiteHeader />
      
      <div class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
          <!-- Page Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Products</h1>
              <p class="text-muted-foreground mt-1 text-sm sm:text-base">
                Manage your product inventory
              </p>
            </div>
            <Dialog v-model:open="dialogOpen">
              <DialogTrigger as-child>
                <Button @click="openCreateDialog" class="w-full sm:w-auto">
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent class="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                <DialogTitle class="text-lg sm:text-xl">{{ editingProduct ? 'Edit Product' : 'Create Product' }}</DialogTitle>
                <DialogDescription class="text-sm">
                  {{ editingProduct ? 'Update product information' : 'Add a new product to your inventory' }}
                </DialogDescription>
                <form @submit.prevent="handleSubmit" class="space-y-3 sm:space-y-4 mt-4">
                  <div class="space-y-2">
                    <Label for="name" class="text-sm">Name</Label>
                    <Input
                      id="name"
                      v-model="formData.name"
                      placeholder="Product name"
                      required
                      class="text-sm"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="description" class="text-sm">Description</Label>
                    <Input
                      id="description"
                      v-model="formData.description"
                      placeholder="Product description"
                      required
                      class="text-sm"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="price" class="text-sm">Price</Label>
                    <Input
                      id="price"
                      v-model.number="formData.price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                      class="text-sm"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="stock" class="text-sm">Stock</Label>
                    <Input
                      id="stock"
                      v-model.number="formData.stock"
                      type="number"
                      placeholder="0"
                      required
                      class="text-sm"
                    />
                  </div>
                  <div class="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button type="button" variant="outline" @click="dialogOpen = false" class="text-sm">
                      Cancel
                    </Button>
                    <Button type="submit" :disabled="productStore.loading" class="text-sm">
                      {{ productStore.loading ? 'Saving...' : 'Save' }}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <!-- Analytics Cards -->
          <SectionCards />

          <!-- Products Table -->
          <Card>
            <CardContent class="p-0">
              <div v-if="productStore.loading && productStore.items.length === 0" class="flex items-center justify-center p-8 sm:p-12">
                <p class="text-muted-foreground text-sm">Loading products...</p>
              </div>

              <div v-else-if="productStore.items.length === 0" class="flex flex-col items-center justify-center p-8 sm:p-12">
                <p class="text-muted-foreground mb-4 text-sm">No products found</p>
                <Button @click="openCreateDialog" class="text-sm">Add your first product</Button>
              </div>

              <div v-else>
                <div class="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="min-w-[60px]">ID</TableHead>
                        <TableHead class="min-w-[120px]">Name</TableHead>
                        <TableHead class="min-w-[150px]">Description</TableHead>
                        <TableHead class="min-w-[80px]">Price</TableHead>
                        <TableHead class="min-w-[60px]">Stock</TableHead>
                        <TableHead class="text-right min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-for="product in productStore.items" :key="product.id">
                        <TableCell class="font-medium text-xs sm:text-sm">{{ product.id }}</TableCell>
                        <TableCell class="text-xs sm:text-sm">{{ product.name }}</TableCell>
                        <TableCell class="text-xs sm:text-sm">{{ product.description }}</TableCell>
                        <TableCell class="text-xs sm:text-sm">${{ product.price.toFixed(2) }}</TableCell>
                        <TableCell class="text-xs sm:text-sm">{{ product.stock }}</TableCell>
                        <TableCell class="text-right">
                          <div class="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              @click="openEditDialog(product)"
                              class="text-xs h-7 px-2"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              @click="handleDelete(product.id)"
                              class="text-xs h-7 px-2"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <!-- Pagination -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t p-3 sm:p-4 gap-3 sm:gap-0">
                  <div class="text-xs sm:text-sm text-muted-foreground">
                    Page {{ productStore.pagination.current_page }} of {{ productStore.pagination.last_page }}
                    ({{ productStore.pagination.total }} total items)
                  </div>
                  <div class="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      :disabled="productStore.pagination.current_page === 1"
                      @click="productStore.prevPage()"
                      class="flex-1 sm:flex-none text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      :disabled="productStore.pagination.current_page === productStore.pagination.last_page"
                      @click="productStore.nextPage()"
                      class="flex-1 sm:flex-none text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useProductStore } from '@/stores/product.store'
import type { Product, ProductFormData } from '@/types/product.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import SectionCards from '@/components/SectionCards.vue'

const productStore = useProductStore()

const dialogOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const formData = reactive<ProductFormData>({
  name: '',
  description: '',
  price: 0,
  stock: 0,
})

const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.price = 0
  formData.stock = 0
  editingProduct.value = null
}

const openCreateDialog = () => {
  resetForm()
  dialogOpen.value = true
}

const openEditDialog = (product: Product) => {
  editingProduct.value = product
  formData.name = product.name
  formData.description = product.description
  formData.price = product.price
  formData.stock = product.stock
  dialogOpen.value = true
}

const handleSubmit = async () => {
  try {
    if (editingProduct.value) {
      await productStore.updateProduct(editingProduct.value.id, formData)
    } else {
      await productStore.createProduct(formData)
    }
    dialogOpen.value = false
    resetForm()
  } catch (error) {
    console.error('Failed to save product:', error)
    alert('Failed to save product. Please try again.')
  }
}

const handleDelete = async (id: number) => {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      await productStore.deleteProduct(id)
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }
}

onMounted(() => {
  productStore.fetchProducts()
})
</script>

