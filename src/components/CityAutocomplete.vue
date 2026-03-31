<template>
  <div class="relative">
    <Input
      :id="id"
      v-model="searchQuery"
      :placeholder="placeholder"
      @input="onInput"
      @focus="showDropdown = true"
      @blur="onBlur"
      @keydown="onKeydown"
      autocomplete="off"
      class="w-full"
    />
    
    <div
      v-if="showDropdown && filteredCities.length > 0"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
    >
      <div
        v-for="(city, index) in filteredCities"
        :key="city"
        @mousedown="selectCity(city)"
        @mouseenter="selectedIndex = index"
        class="px-3 py-2 cursor-pointer text-sm transition-colors"
        :class="{
          'bg-blue-100 text-blue-900': selectedIndex === index,
          'hover:bg-gray-100': selectedIndex !== index
        }"
      >
        <span class="font-medium" v-html="highlightMatch(city)"></span>
      </div>
    </div>
    
    <div
      v-if="showDropdown && searchQuery && filteredCities.length === 0"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3"
    >
      <div class="text-sm text-gray-500 text-center">
        Tidak ada kota yang ditemukan
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Input } from '@/components/ui/input'

interface Props {
  id?: string
  placeholder?: string
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  id: 'city-autocomplete',
  placeholder: 'Ketik nama kota... (cth: cima, jkt, jogja)'
})

const emit = defineEmits<Emits>()

const searchQuery = ref('')
const showDropdown = ref(false)
const selectedIndex = ref(-1)

// Daftar kota-kota populer di Indonesia dengan alias
const cityData = [
  { name: 'Jakarta', aliases: ['DKI Jakarta', 'Ibukota', 'JKT'] },
  { name: 'Surabaya', aliases: ['Kota Pahlawan', 'SBY'] },
  { name: 'Bandung', aliases: ['Kota Kembang', 'Paris van Java', 'BDG'] },
  { name: 'Medan', aliases: ['MDN'] },
  { name: 'Semarang', aliases: ['SMG'] },
  { name: 'Makassar', aliases: ['Ujung Pandang', 'MKS'] },
  { name: 'Palembang', aliases: ['PLB'] },
  { name: 'Tangerang', aliases: ['TNG'] },
  { name: 'Depok', aliases: ['DPK'] },
  { name: 'Bekasi', aliases: ['BKS'] },
  { name: 'Bogor', aliases: ['Kota Hujan', 'BGR'] },
  { name: 'Batam', aliases: ['BTM'] },
  { name: 'Pekanbaru', aliases: ['PKU'] },
  { name: 'Bandar Lampung', aliases: ['Lampung', 'BDL'] },
  { name: 'Malang', aliases: ['MLG'] },
  { name: 'Padang', aliases: ['PDG'] },
  { name: 'Denpasar', aliases: ['Bali', 'DPS'] },
  { name: 'Samarinda', aliases: ['SMD'] },
  { name: 'Tasikmalaya', aliases: ['Tasik', 'TSM'] },
  { name: 'Pontianak', aliases: ['PTK'] },
  { name: 'Balikpapan', aliases: ['BPN'] },
  { name: 'Jambi', aliases: ['JMB'] },
  { name: 'Surakarta', aliases: ['Solo', 'SLO'] },
  { name: 'Yogyakarta', aliases: ['Jogja', 'Yogya', 'YGY'] },
  { name: 'Cirebon', aliases: ['CRB'] },
  { name: 'Serang', aliases: ['SRG'] },
  { name: 'Manado', aliases: ['MND'] },
  { name: 'Banjarmasin', aliases: ['BJM'] },
  { name: 'Bengkulu', aliases: ['BGL'] },
  { name: 'Kediri', aliases: ['KDR'] },
  { name: 'Ambon', aliases: ['AMB'] },
  { name: 'Jayapura', aliases: ['JYP'] },
  { name: 'Cimahi', aliases: ['CMH'] },
  { name: 'Sukabumi', aliases: ['SKB'] },
  { name: 'Cilegon', aliases: ['CLG'] },
  { name: 'Mataram', aliases: ['Lombok', 'MTR'] },
  { name: 'Kupang', aliases: ['KPG'] },
  { name: 'Palu', aliases: ['PLU'] },
  { name: 'Kendari', aliases: ['KDI'] },
  { name: 'Ternate', aliases: ['TRN'] },
  { name: 'Sorong', aliases: ['SRN'] },
  { name: 'Gorontalo', aliases: ['GTO'] },
  { name: 'Tegal', aliases: ['TGL'] },
  { name: 'Purwokerto', aliases: ['PWK'] },
  { name: 'Cilacap', aliases: ['CLP'] },
  { name: 'Karawang', aliases: ['KRW'] },
  { name: 'Garut', aliases: ['GRT'] },
  { name: 'Subang', aliases: ['SBG'] },
  { name: 'Indramayu', aliases: ['IDM'] },
  { name: 'Kuningan', aliases: ['KNG'] },
  { name: 'Majalengka', aliases: ['MJL'] },
  { name: 'Pangandaran', aliases: ['PGD'] },
  { name: 'Ciamis', aliases: ['CMS'] },
  { name: 'Banjar', aliases: ['BJR'] },
  { name: 'Purwakarta', aliases: ['PWK'] },
  { name: 'Cianjur', aliases: ['CJR'] },
  { name: 'Lebak', aliases: ['LBK'] },
  { name: 'Pandeglang', aliases: ['PDG'] },
  { name: 'Tangerang Selatan', aliases: ['Tangsel', 'TNS'] },
  { name: 'Blitar', aliases: ['BLT'] },
  { name: 'Tulungagung', aliases: ['TLA'] },
  { name: 'Trenggalek', aliases: ['TGK'] },
  { name: 'Nganjuk', aliases: ['NJK'] },
  { name: 'Madiun', aliases: ['MDN'] },
  { name: 'Magetan', aliases: ['MGT'] },
  { name: 'Ponorogo', aliases: ['PNG'] },
  { name: 'Pacitan', aliases: ['PCT'] },
  { name: 'Wonogiri', aliases: ['WNG'] },
  { name: 'Karanganyar', aliases: ['KRA'] },
  { name: 'Sragen', aliases: ['SRG'] },
  { name: 'Grobogan', aliases: ['GBG'] },
  { name: 'Blora', aliases: ['BLR'] },
  { name: 'Rembang', aliases: ['RBG'] },
  { name: 'Pati', aliases: ['PTI'] },
  { name: 'Kudus', aliases: ['KDS'] },
  { name: 'Jepara', aliases: ['JPR'] },
  { name: 'Demak', aliases: ['DMK'] },
  { name: 'Temanggung', aliases: ['TMG'] },
  { name: 'Wonosobo', aliases: ['WSB'] },
  { name: 'Purworejo', aliases: ['PWR'] },
  { name: 'Kebumen', aliases: ['KBM'] },
  { name: 'Banjarnegara', aliases: ['BJN'] },
  { name: 'Banyumas', aliases: ['BMS'] }
]

// Flatten all cities and aliases for searching
const allSearchTerms = cityData.flatMap(city => 
  [city.name, ...city.aliases].map(term => ({ term, cityName: city.name }))
)

const filteredCities = computed(() => {
  if (!searchQuery.value) return []
  
  const query = searchQuery.value.toLowerCase().trim()
  if (query.length < 2) return []
  
  // Search through all terms (city names and aliases)
  const matches = allSearchTerms
    .map(({ term, cityName }) => {
      const termLower = term.toLowerCase()
      let score = 0
      
      // Exact match gets highest score
      if (termLower === query) {
        score = 1000
      }
      // Starts with query gets high score
      else if (termLower.startsWith(query)) {
        score = 500
      }
      // Contains query gets medium score
      else if (termLower.includes(query)) {
        score = 100
      }
      // Fuzzy match for partial characters
      else {
        let fuzzyScore = 0
        let queryIndex = 0
        
        for (let i = 0; i < termLower.length && queryIndex < query.length; i++) {
          if (termLower[i] === query[queryIndex]) {
            fuzzyScore += 10
            queryIndex++
          }
        }
        
        // Only include if at least 60% of query characters match
        if (queryIndex >= Math.ceil(query.length * 0.6)) {
          score = fuzzyScore
        }
      }
      
      return { cityName, score, matchedTerm: term }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
  
  // Remove duplicates and keep only unique city names
  const uniqueCities = []
  const seenCities = new Set()
  
  for (const match of matches) {
    if (!seenCities.has(match.cityName)) {
      seenCities.add(match.cityName)
      uniqueCities.push(match.cityName)
      if (uniqueCities.length >= 8) break
    }
  }
  
  return uniqueCities
})

const onInput = () => {
  showDropdown.value = true
  selectedIndex.value = -1
  emit('update:modelValue', searchQuery.value)
}

const selectCity = (city: string) => {
  searchQuery.value = city
  showDropdown.value = false
  selectedIndex.value = -1
  emit('update:modelValue', city)
}

const onKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value || filteredCities.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCities.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectCity(filteredCities.value[selectedIndex.value])
      }
      break
    case 'Escape':
      showDropdown.value = false
      selectedIndex.value = -1
      break
  }
}

const onBlur = () => {
  // Delay hiding dropdown to allow click events
  setTimeout(() => {
    showDropdown.value = false
    selectedIndex.value = -1
  }, 150)
}

const highlightMatch = (city: string) => {
  if (!searchQuery.value) return city
  
  const query = searchQuery.value.toLowerCase().trim()
  const cityLower = city.toLowerCase()
  const index = cityLower.indexOf(query)
  
  if (index === -1) return city
  
  const before = city.substring(0, index)
  const match = city.substring(index, index + query.length)
  const after = city.substring(index + query.length)
  
  return `${before}<mark class="bg-yellow-200 px-0.5 rounded">${match}</mark>${after}`
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== searchQuery.value) {
    searchQuery.value = newValue || ''
  }
}, { immediate: true })
</script>