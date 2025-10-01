import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

export const loadOBJModel = (objPath, mtlPath) => {
  return new Promise((resolve, reject) => {
    // Cargar materiales primero
    const mtlLoader = new MTLLoader()
    
    mtlLoader.load(
      mtlPath,
      (materials) => {
        materials.preload()
        
        // Cargar el modelo OBJ con los materiales
        const objLoader = new OBJLoader()
        objLoader.setMaterials(materials)
        
        objLoader.load(
          objPath,
          (object) => {
            resolve(object)
          },
          (progress) => {
            console.log('Cargando:', (progress.loaded / progress.total * 100).toFixed(2) + '%')
          },
          (error) => {
            reject(error)
          }
        )
      },
      undefined,
      (error) => {
        reject(error)
      }
    )
  })
}

// Asignar regiones anatómicas al modelo
export const assignAnatomicalRegions = (model) => {
  model.traverse((child) => {
    if (child.isMesh) {
      const meshName = child.name.toLowerCase()
      
      // Asignar región según el nombre del mesh
      if (meshName.includes('head') || meshName.includes('cabeza') || meshName.includes('skull')) {
        child.userData = { region: 'head', name: 'Cabeza y Cuello' }
        child.material = new THREE.MeshStandardMaterial({ 
          color: 0xFF6B6B,
          roughness: 0.7 
        })
      } 
      else if (meshName.includes('chest') || meshName.includes('torso') || meshName.includes('thorax')) {
        child.userData = { region: 'chest', name: 'Tórax' }
        child.material = new THREE.MeshStandardMaterial({ 
          color: 0x4ECDC4,
          roughness: 0.7 
        })
      }
      else if (meshName.includes('abdomen') || meshName.includes('belly') || meshName.includes('stomach')) {
        child.userData = { region: 'abdomen', name: 'Abdomen' }
        child.material = new THREE.MeshStandardMaterial({ 
          color: 0x45B7D1,
          roughness: 0.7 
        })
      }
      else if (meshName.includes('arm') || meshName.includes('hand') || meshName.includes('brazo')) {
        child.userData = { region: 'arms', name: 'Miembros Superiores' }
        child.material = new THREE.MeshStandardMaterial({ 
          color: 0x96CEB4,
          roughness: 0.7 
        })
      }
      else if (meshName.includes('pelvis') || meshName.includes('hip') || meshName.includes('genital')) {
        child.userData = { region: 'genitals', name: 'Región Pélvica' }
        child.material = new THREE.MeshStandardMaterial({ 
          color: 0xFDEAA7,
          roughness: 0.7 
        })
      }
      else if (meshName.includes('leg') || meshName.includes('foot') || meshName.includes('pierna')) {
        child.userData = { region: 'legs', name: 'Miembros Inferiores' }
        child.material = new THREE.MeshStandardMaterial({ 
          color: 0xDDA0DD,
          roughness: 0.7 
        })
      }
      else {
        // Color por defecto para partes no identificadas
        child.userData = { region: 'unknown', name: 'Región General' }
        child.material = new THREE.MeshStandardMaterial({ 
          color: 0xFFDBAC,
          roughness: 0.7 
        })
      }
      
      // Guardar color original para hover
      child.userData.originalColor = child.material.color.getHex()
    }
  })
  
  return model
}