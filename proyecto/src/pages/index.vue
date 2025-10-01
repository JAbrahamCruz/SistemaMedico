<template>
  
    <v-app-bar color="primary" dark>
      <v-app-bar-title>MedExplora - Modelo Anatómico</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleFullscreen">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
    </v-app-bar>

      <v-container fluid class="pa-0">
        <v-row no-gutters>
          <!-- Modelo 3D -->
          <v-col cols="12" md="8">
            <AnatomicalModel3D @region-selected="handleRegionSelection" />
          </v-col>

          <!-- Panel lateral -->
          <v-col cols="12" md="4">
            <v-card class="fill-height">
              <v-card-title class="bg-blue-grey-lighten-4">
                <v-icon class="mr-2">mdi-body-outline</v-icon>
                Regiones Anatómicas
              </v-card-title>

              <v-card-text>
                <v-alert v-if="!selectedRegion" type="info" variant="tonal" class="mb-4">
                  Haz click en una región del modelo 3D
                </v-alert>

                <v-alert v-else type="success" variant="tonal" class="mb-4">
                  <strong>{{ selectedRegion.name }}</strong> seleccionada
                </v-alert>

                <v-list>
                  <v-list-item
                    v-for="region in regions"
                    :key="region.id"
                    :active="selectedRegion?.id === region.id"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-avatar :color="region.color" size="small">
                        <v-icon color="white">{{ region.icon }}</v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title>{{ region.name }}</v-list-item-title>

                    <template v-slot:append>
                      <v-icon>mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
</template>

<script setup>
import { ref } from 'vue'
import AnatomicalModel3D from '@/components/AnatomicalModel3D.vue'

const selectedRegion = ref(null)

const regions = [
  { id: 'head', name: 'Cabeza y Cuello', color: '#FF6B6B', icon: 'mdi-head-outline' },
  { id: 'chest', name: 'Tórax', color: '#4ECDC4', icon: 'mdi-heart-pulse' },
  { id: 'abdomen', name: 'Abdomen', color: '#45B7D1', icon: 'mdi-stomach' },
]

const handleRegionSelection = (region) => {
  selectedRegion.value = region
  console.log('Región seleccionada:', region)
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>