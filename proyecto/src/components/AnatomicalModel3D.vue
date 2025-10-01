<template>
  <v-container fluid class="pa-0">
    <div ref="threeContainer" class="three-container">
      <!-- Loading overlay -->
      <v-overlay v-model="loading" class="d-flex align-center justify-center">
        <v-progress-circular 
          indeterminate 
          size="64" 
          color="primary"
        ></v-progress-circular>
        <p class="mt-4">Cargando modelo 3D...</p>
      </v-overlay>
      
      <!-- Controls overlay -->
      <div class="controls-overlay">
        <v-card class="pa-2">
          <v-btn-group variant="outlined" density="compact">
            <v-btn @click="resetCamera" icon="mdi-home" title="Resetear vista"></v-btn>
            <v-btn @click="zoomIn" icon="mdi-plus" title="Acercar"></v-btn>
            <v-btn @click="zoomOut" icon="mdi-minus" title="Alejar"></v-btn>
          </v-btn-group>
        </v-card>
      </div>

      <!-- Info de región seleccionada -->
      <div v-if="selectedRegion" class="info-overlay">
        <v-card class="pa-3">
          <v-card-title class="text-h6">{{ selectedRegion.name }}</v-card-title>
          <v-card-text>Click para más detalles</v-card-text>
        </v-card>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loadOBJModel, assignAnatomicalRegions } from '@/utils/modelLoader'

// Props
const props = defineProps({
  regions: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['region-selected'])

// Refs
const threeContainer = ref(null)
const loading = ref(true)
const selectedRegion = ref(null)

// Three.js variables
let scene, camera, renderer, controls
let raycaster, mouse

// Inicialización de la escena
const initScene = () => {
  if (!threeContainer.value) return

  // Escena
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  // Cámara
  const width = threeContainer.value.clientWidth
  const height = threeContainer.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  threeContainer.value.appendChild(renderer.domElement)

  // Controles
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = true
  controls.enableRotate = true
  controls.enableZoom = true

  // Raycaster
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // Luz
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  scene.add(directionalLight)

  // Cargar modelo y ajustar cámara
  loadModel().then(() => resetCamera())

  // Eventos
  window.addEventListener('resize', onWindowResize)
  renderer.domElement.addEventListener('click', onMouseClick)

  // Animar
  animate()
  loading.value = false
}

// Crear modelo 3D
const loadModel = async () => {
  try {
    // Cargar modelo masculino
    const maleModel = await loadOBJModel(
      '/src/assets/models/male_template.obj',
      '/src/assets/models/male_template.mtl'
    )
    
    // Cargar modelo femenino
    const femaleModel = await loadOBJModel(
      '/src/assets/models/female_template.obj',
      '/src/assets/models/female_template.mtl'
    )
    
    // Configurar modelo masculino
    maleModel.scale.setScalar(2.0)
    const maleBox = new THREE.Box3().setFromObject(maleModel)
    const maleCenter = maleBox.getCenter(new THREE.Vector3())
    const maleSize = maleBox.getSize(new THREE.Vector3())
    
    maleModel.position.x = maleSize.x * 0.35
    maleModel.position.y = -maleCenter.y + (maleSize.y / 2)
    maleModel.position.z = -maleCenter.z
    
    assignAnatomicalRegions(maleModel)
    scene.add(maleModel)
    
    // Configurar modelo femenino
    femaleModel.scale.setScalar(2.0)
    const femaleBox = new THREE.Box3().setFromObject(femaleModel)
    const femaleCenter = femaleBox.getCenter(new THREE.Vector3())
    const femaleSize = femaleBox.getSize(new THREE.Vector3())
    
    femaleModel.position.x = -femaleSize.x * 0.35
    femaleModel.position.y = -femaleCenter.y + (femaleSize.y / 2) - 1
    femaleModel.position.z = -femaleCenter.z 
    
    assignAnatomicalRegions(femaleModel)
    scene.add(femaleModel)

    resetCamera()
    
    loading.value = false
    
  } catch (error) {
    console.error('Error cargando modelos:', error)
    createTemporaryModel()
    loading.value = false
  }
}

// Animación
const animate = () => {
  requestAnimationFrame(animate)
  //controls.update()
  renderer.render(scene, camera)
}

// Resize
const onWindowResize = () => {
  if (!threeContainer.value) return
  
  const width = threeContainer.value.clientWidth
  const height = threeContainer.value.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// Click en modelo
const onMouseClick = (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    const object = intersects[0].object
    if (object.userData.region) {
      selectedRegion.value = {
        id: object.userData.region,
        name: object.userData.name
      }
      emit('region-selected', selectedRegion.value)
      
      zoomToRegion(object)
    }
  }
}

// Controles de cámara
const resetCamera = () => {
  const box = new THREE.Box3()
  scene.children.forEach(child => {
    if (child.type === 'Group' || child.type === 'Object3D') {
      box.expandByObject(child)
    }
  })
  
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  
  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
  cameraZ *= 1.3
  
  camera.position.set(center.x, center.y + size.y * 0.1, center.z + cameraZ)
  camera.lookAt(center)
  controls.target.copy(center)
  controls.update()
}

const zoomIn = () => {
  camera.position.multiplyScalar(0.9)
  camera.updateProjectionMatrix()
}

const zoomOut = () => {
  camera.position.multiplyScalar(1.1)
  camera.updateProjectionMatrix()
}

const zoomToRegion = (object) => {
  const targetPosition = object.position.clone()
  controls.target.copy(targetPosition)
  controls.update()
}

// Lifecycle
onMounted(() => {
  initScene()
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.three-container {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 500px;
  overflow: hidden;
}

.controls-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.info-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  max-width: 300px;
}
</style>