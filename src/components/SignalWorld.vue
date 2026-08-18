<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  activeSection: { type: String, default: 'home' },
  routeProgress: { type: Number, default: 0 },
  routeStops: { type: Array, default: () => [] },
  reducedMotion: { type: Boolean, default: false },
})

const canvasHost = ref(null)
const fallback = ref(false)

// The stretch of road the camera travels while the route section is active; the career timeline
// maps onto it linearly, so river stations and 3D stations share one scale.
const ROUTE_CORRIDOR_START = -24
const ROUTE_CORRIDOR_END = -54
// The camera stops short of the focused station so the station stays ahead of it, in frame.
const ROUTE_CAMERA_STANDOFF = 9

/**
 * Maps normalized career progress onto the corridor.
 * @param {number} progress - Normalized position, clamped to 0..1.
 * @returns {number} World z coordinate.
 */
const corridorZ = (progress) => {
  const clamped = Math.min(1, Math.max(0, progress || 0))
  return ROUTE_CORRIDOR_START + (ROUTE_CORRIDOR_END - ROUTE_CORRIDOR_START) * clamped
}

const sectionZ = {
  home: 8,
  twin: -64,
  network: -104,
  business: -144,
  skills: -184,
  about: -220,
  contact: -254,
}

let scene
let camera
let renderer
let animationFrame
let resizeObserver
let clock
let targetZ = sectionZ.home
let targetX = 0
let particles
let roadPulse
let heatPoints
let skillCore
let beacon
let routeLights = []
let vehicles = []
let worldMaterials = []

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

function material(options) {
  const instance = new THREE.MeshStandardMaterial(options)
  worldMaterials.push(instance)
  return instance
}

function addTerrain() {
  const geometry = new THREE.PlaneGeometry(42, 300, 42, 240)
  const positions = geometry.attributes.position

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const height = Math.sin(x * 0.4) * 0.16 + Math.cos(y * 0.13) * 0.22
    positions.setZ(i, height)
  }

  geometry.computeVertexNormals()
  const terrain = new THREE.Mesh(
    geometry,
    material({ color: 0x0c181b, roughness: 0.92, metalness: 0.08, wireframe: false }),
  )
  terrain.rotation.x = -Math.PI / 2
  terrain.position.z = -122
  terrain.receiveShadow = true
  scene.add(terrain)

  const grid = new THREE.GridHelper(300, 150, 0x18383b, 0x10282c)
  grid.position.set(0, 0.05, -122)
  grid.rotation.y = Math.PI / 2
  grid.material.transparent = true
  grid.material.opacity = 0.52
  scene.add(grid)
}

function addRoad() {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 290),
    material({ color: 0x101a1e, roughness: 0.78, metalness: 0.18 }),
  )
  road.rotation.x = -Math.PI / 2
  road.position.set(0, 0.11, -122)
  scene.add(road)

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x32d6c5 })
  for (let z = 17; z > -264; z -= 7) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 3.1), lineMaterial)
    dash.rotation.x = -Math.PI / 2
    dash.position.set(0, 0.14, z)
    scene.add(dash)
  }

  roadPulse = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 8),
    new THREE.MeshBasicMaterial({ color: 0xd8f24a, transparent: true, opacity: 0.95 }),
  )
  roadPulse.rotation.x = -Math.PI / 2
  roadPulse.position.set(0, 0.18, 8)
  scene.add(roadPulse)
}

function addBuildings() {
  const box = new THREE.BoxGeometry(1, 1, 1)
  const buildingMaterial = material({ color: 0x173035, roughness: 0.72, metalness: 0.25 })
  const emissiveMaterial = material({
    color: 0x172c30,
    emissive: 0x123d3d,
    emissiveIntensity: 0.3,
    roughness: 0.65,
  })
  const count = 160
  const buildings = new THREE.InstancedMesh(box, buildingMaterial, count)
  const litBuildings = new THREE.InstancedMesh(box, emissiveMaterial, 36)

  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1
    const z = 12 - (i / count) * 274 + Math.sin(i * 4.7) * 3
    const x = side * (4.5 + (i % 9) * 0.7)
    const height = 0.7 + ((i * 13) % 9) * 0.34
    tempObject.position.set(x, height / 2, z)
    tempObject.scale.set(0.8 + (i % 4) * 0.22, height, 0.9 + (i % 3) * 0.3)
    tempObject.rotation.y = (i % 5) * 0.08
    tempObject.updateMatrix()
    buildings.setMatrixAt(i, tempObject.matrix)
  }

  for (let i = 0; i < 36; i += 1) {
    const side = i % 2 === 0 ? -1 : 1
    const z = 2 - i * 7.1
    const x = side * (6.4 + (i % 4) * 1.1)
    const height = 1.1 + (i % 5) * 0.5
    tempObject.position.set(x, height / 2, z)
    tempObject.scale.set(0.9, height, 0.9)
    tempObject.updateMatrix()
    litBuildings.setMatrixAt(i, tempObject.matrix)
  }

  scene.add(buildings, litBuildings)
}

/**
 * Places one lit station per career entry, using the same corridor scale as the camera travel.
 * Reads `routeStops` once during `init()`: the experience list is static configuration, so the
 * stations are never rebuilt afterwards.
 */
function addRouteStations() {
  if (!props.routeStops.length) return

  const stationGeometry = new THREE.CylinderGeometry(1.5, 2, 0.4, 24)
  const stationMaterial = material({
    color: 0x20393a,
    emissive: 0x32d6c5,
    emissiveIntensity: 0.2,
    roughness: 0.55,
  })

  props.routeStops.forEach((stop, index) => {
    const z = corridorZ(stop)
    const station = new THREE.Mesh(stationGeometry, stationMaterial)
    station.position.set(index % 2 === 0 ? -5.5 : 5.5, 0.35, z)
    scene.add(station)

    const light = new THREE.PointLight(index === 1 ? 0xff6b5f : 0x32d6c5, 2.2, 12)
    light.position.set(station.position.x, 2.2, z)
    routeLights.push(light)
    scene.add(light)
  })
}

function addTwinDistrict() {
  const group = new THREE.Group()
  group.position.z = -68

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(19, 0.5, 19),
    material({ color: 0x14252a, roughness: 0.72, metalness: 0.3 }),
  )
  platform.position.y = 0.05
  group.add(platform)

  const roofMaterial = material({
    color: 0xd8f24a,
    emissive: 0x4f5a12,
    emissiveIntensity: 0.26,
    roughness: 0.55,
  })
  const wallMaterial = material({ color: 0x36545a, roughness: 0.68 })

  for (let i = 0; i < 7; i += 1) {
    const building = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3 + (i % 3) * 0.6, 2.8), wallMaterial)
    building.position.set(-6 + (i % 4) * 4, building.geometry.parameters.height / 2 + 0.3, -4 + Math.floor(i / 4) * 7)
    group.add(building)

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 3.1), roofMaterial)
    roof.position.set(building.position.x, building.position.y + building.geometry.parameters.height / 2 + 0.1, building.position.z)
    group.add(roof)
  }

  const vehicleGeometry = new THREE.BoxGeometry(0.58, 0.38, 1.05)
  const vehicleMaterial = material({ color: 0xff6b5f, emissive: 0x6d1610, emissiveIntensity: 0.45 })
  for (let i = 0; i < 9; i += 1) {
    const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial)
    vehicle.position.set(-8 + i * 2, 0.55, 7)
    vehicle.userData.offset = i * 2.3
    vehicles.push(vehicle)
    group.add(vehicle)
  }

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(19.5, 5.5, 19.5)),
    new THREE.LineBasicMaterial({ color: 0x32d6c5, transparent: true, opacity: 0.35 }),
  )
  outline.position.y = 2.3
  group.add(outline)

  scene.add(group)
}

function addHeatBasin() {
  const group = new THREE.Group()
  group.position.z = -107
  const geometry = new THREE.SphereGeometry(0.18, 10, 8)
  const materialInstance = new THREE.MeshBasicMaterial({ vertexColors: true })
  heatPoints = new THREE.InstancedMesh(geometry, materialInstance, 280)

  for (let i = 0; i < 280; i += 1) {
    const angle = i * 2.399
    const radius = 0.45 * Math.sqrt(i)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const wave = 0.45 + Math.sin(x * 0.65) * 0.7 + Math.cos(z * 0.72) * 0.45
    tempObject.position.set(x, Math.max(0.2, wave), z)
    const scale = 0.55 + Math.max(0, wave) * 0.36
    tempObject.scale.setScalar(scale)
    tempObject.updateMatrix()
    heatPoints.setMatrixAt(i, tempObject.matrix)
    tempColor.set(i % 11 < 3 ? 0xff6b5f : i % 7 < 3 ? 0xd8f24a : 0x32d6c5)
    heatPoints.setColorAt(i, tempColor)
  }

  group.add(heatPoints)
  scene.add(group)
}

function addBusinessDock() {
  const group = new THREE.Group()
  group.position.z = -146
  const frameMaterial = material({ color: 0x263c43, metalness: 0.35, roughness: 0.54 })
  const screenMaterial = material({ color: 0x132124, emissive: 0x32d6c5, emissiveIntensity: 0.58 })
  const sizes = [
    [6.4, 3.6, -7],
    [2.7, 5.4, 0],
    [3.5, 4.7, 6],
  ]

  sizes.forEach(([width, height, x], index) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.4), frameMaterial)
    frame.position.set(x, height / 2 + 0.4, 0)
    frame.rotation.y = index === 0 ? 0.13 : index === 2 ? -0.15 : 0
    group.add(frame)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.86, height * 0.82), screenMaterial)
    screen.position.set(x, height / 2 + 0.4, 0.23)
    screen.rotation.y = frame.rotation.y
    group.add(screen)
  })

  scene.add(group)
}

function addSkillCore() {
  skillCore = new THREE.Group()
  skillCore.position.z = -187
  const coreMaterial = material({
    color: 0xd8f24a,
    emissive: 0x758418,
    emissiveIntensity: 0.7,
    metalness: 0.36,
    roughness: 0.32,
  })
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), coreMaterial)
  skillCore.add(core)

  const nodeGeometry = new THREE.SphereGeometry(0.35, 12, 12)
  const nodeMaterial = material({ color: 0x32d6c5, emissive: 0x1b7970, emissiveIntensity: 0.6 })
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x65717c, transparent: true, opacity: 0.72 })

  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2
    const y = ((i % 4) - 1.5) * 1.4
    const radius = 5 + (i % 3) * 0.8
    const position = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
    node.position.copy(position)
    skillCore.add(node)

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), position])
    skillCore.add(new THREE.Line(lineGeometry, lineMaterial))
  }
  skillCore.position.y = 3
  scene.add(skillCore)
}

function addContactBeacon() {
  beacon = new THREE.Group()
  beacon.position.set(0, 0, -257)
  const rings = [2.2, 3.6, 5]
  rings.forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.05 + index * 0.015, 12, 90),
      new THREE.MeshBasicMaterial({ color: index === 1 ? 0xd8f24a : 0x32d6c5, transparent: true, opacity: 0.8 }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.25 + index * 0.18
    beacon.add(ring)
  })
  const tower = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 7, 8),
    material({ color: 0x32d6c5, emissive: 0x1c7169, emissiveIntensity: 0.75, roughness: 0.4 }),
  )
  tower.position.y = 3.5
  beacon.add(tower)
  scene.add(beacon)
}

function addParticles() {
  const count = window.innerWidth < 700 ? 450 : 900
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 55
    positions[i * 3 + 1] = Math.random() * 16 + 0.5
    positions[i * 3 + 2] = 20 - Math.random() * 300
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x4cb6aa, size: 0.045, transparent: true, opacity: 0.58 }),
  )
  scene.add(particles)
}

function init() {
  try {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x071014)
    scene.fog = new THREE.FogExp2(0x071014, 0.028)

    camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500)
    camera.position.set(10, 8, 17)
    camera.lookAt(0, 1, 0)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.15 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    canvasHost.value.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xc9edf0, 0x071014, 1.7))
    const keyLight = new THREE.DirectionalLight(0xe8eff0, 2.1)
    keyLight.position.set(7, 13, 5)
    scene.add(keyLight)

    const coralLight = new THREE.PointLight(0xff6b5f, 18, 25)
    coralLight.position.set(-10, 5, -100)
    scene.add(coralLight)

    addTerrain()
    addRoad()
    addBuildings()
    addRouteStations()
    addTwinDistrict()
    addHeatBasin()
    addBusinessDock()
    addSkillCore()
    addContactBeacon()
    addParticles()

    clock = new THREE.Clock()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvasHost.value)
    resize()
    animate()
  } catch (error) {
    console.error(error)
    fallback.value = true
  }
}

function resize() {
  if (!renderer || !canvasHost.value) return
  const width = canvasHost.value.clientWidth
  const height = canvasHost.value.clientHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function handleVisibilityChange() {
  if (document.hidden) {
    cancelAnimationFrame(animationFrame)
    animationFrame = undefined
    return
  }

  if (!animationFrame && renderer) {
    clock?.getDelta()
    animate()
  }
}

function animate() {
  if (document.hidden) {
    animationFrame = undefined
    return
  }

  const delta = Math.min(clock.getDelta(), 0.033)
  const elapsed = clock.elapsedTime
  // 0.02 per second reaches ~90% in about 590ms, matching the river's --motion-travel pan.
  const ease = props.reducedMotion ? 1 : 1 - Math.pow(0.02, delta)

  camera.position.z += (targetZ - camera.position.z) * ease
  camera.position.x += (targetX - camera.position.x) * ease
  const lookAhead = new THREE.Vector3(0, props.activeSection === 'skills' ? 3 : 1.1, camera.position.z - 10)
  camera.lookAt(lookAhead)

  if (!props.reducedMotion) {
    camera.position.y = 7.6 + Math.sin(elapsed * 0.32) * 0.22
    particles.rotation.y = elapsed * 0.006
    roadPulse.position.z = 12 - ((elapsed * 13) % 280)
    routeLights.forEach((light, index) => {
      light.intensity = 1.6 + Math.sin(elapsed * 2 + index) * 0.7
    })
    vehicles.forEach((vehicle, index) => {
      vehicle.position.x = -8 + ((elapsed * (1.2 + index * 0.03) + vehicle.userData.offset) % 16)
    })
    if (heatPoints) heatPoints.rotation.y = elapsed * 0.045
    if (skillCore) {
      skillCore.rotation.y = elapsed * 0.13
      skillCore.rotation.x = Math.sin(elapsed * 0.22) * 0.08
    }
    if (beacon) {
      beacon.rotation.y = elapsed * 0.08
      beacon.children.slice(0, 3).forEach((ring, index) => {
        const scale = 1 + Math.sin(elapsed * 1.4 - index * 0.7) * 0.08
        ring.scale.setScalar(scale)
      })
    }
  }

  renderer.render(scene, camera)
  animationFrame = requestAnimationFrame(animate)
}

/** Re-aims the camera; inside the route section the target follows the scrubbed career position. */
function updateTarget() {
  const section = props.activeSection
  targetZ = section === 'route'
    ? corridorZ(props.routeProgress) + ROUTE_CAMERA_STANDOFF
    : sectionZ[section] ?? sectionZ.home
  targetX = section === 'twin' ? -8 : section === 'network' ? 7 : section === 'business' ? -5 : 0
}

watch([() => props.activeSection, () => props.routeProgress], updateTarget, { immediate: true })

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  init()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  scene?.traverse((object) => {
    if (object.geometry) object.geometry.dispose()
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((entry) => entry.dispose())
    }
  })
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div ref="canvasHost" class="world-canvas" aria-hidden="true">
    <div v-if="fallback" class="world-fallback"></div>
  </div>
</template>
