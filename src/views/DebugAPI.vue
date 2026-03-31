<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">API Debug Panel</h1>
    
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <Button @click="testCities" :disabled="loading">Test Cities API</Button>
        <Button @click="testTerminals" :disabled="loading">Test Terminals API</Button>
        <Button @click="testRoutes" :disabled="loading">Test Routes API</Button>
        <Button @click="testVehicles" :disabled="loading">Test Vehicles API</Button>
      </div>
      
      <div v-if="loading" class="text-center py-4">
        <p>Loading...</p>
      </div>
      
      <div v-if="result" class="mt-4">
        <h3 class="font-bold">Result:</h3>
        <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
      
      <div v-if="error" class="mt-4 text-red-600">
        <h3 class="font-bold">Error:</h3>
        <pre class="bg-red-50 p-4 rounded text-sm">{{ error }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { cityService } from '@/services/city.service'
import { terminalService } from '@/services/terminal.service'
import { routeService } from '@/services/route.service'
import { vehicleService } from '@/services/vehicle.service'

const loading = ref(false)
const result = ref<any>(null)
const error = ref<string>('')

const testCities = async () => {
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await cityService.getAll()
    result.value = response
  } catch (err: any) {
    error.value = err.message || 'Unknown error'
    console.error('Cities API Error:', err)
  } finally {
    loading.value = false
  }
}

const testTerminals = async () => {
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await terminalService.getAll()
    result.value = response
  } catch (err: any) {
    error.value = err.message || 'Unknown error'
    console.error('Terminals API Error:', err)
  } finally {
    loading.value = false
  }
}

const testRoutes = async () => {
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await routeService.getAll()
    result.value = response
  } catch (err: any) {
    error.value = err.message || 'Unknown error'
    console.error('Routes API Error:', err)
  } finally {
    loading.value = false
  }
}

const testVehicles = async () => {
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await vehicleService.getAll()
    result.value = response
  } catch (err: any) {
    error.value = err.message || 'Unknown error'
    console.error('Vehicles API Error:', err)
  } finally {
    loading.value = false
  }
}
</script>