// import * as THREE from "three"
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"


// /* ================= SCENE ================= */
// const scene = new THREE.Scene()
// scene.background = new THREE.Color(0x87ceeb)

// /* ================= CAMERA ================= */
// const camera = new THREE.PerspectiveCamera(
//     60,
//     window.innerWidth / window.innerHeight,
//     0.1,
//     1000
// )
// camera.position.set(0, 2, 6)

// /* ================= RENDERER ================= */
// const renderer = new THREE.WebGLRenderer({ antialias: true })
// renderer.setSize(window.innerWidth, window.innerHeight)
// document.body.appendChild(renderer.domElement)

// /* ================= LIGHT ================= */
// scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

// const dirLight = new THREE.DirectionalLight(0xffffff, 1)
// dirLight.position.set(5, 10, 7)
// scene.add(dirLight)

// /* ================= CONTROLS ================= */
// const controls = new OrbitControls(camera, renderer.domElement)
// controls.target.set(0, 1, 0)
// controls.update()

// /* ================= CLOCK ================= */
// const clock = new THREE.Clock()
// let mixer = null

// /* ⭐ GLOBAL PLAYER */
// let player = null

// /* ================= LOADER ================= */
// const loader = new GLTFLoader()

// /* ================= LOAD MAP ================= */
// loader.load("/models/map.glb", (gltf) => {
//     const map = gltf.scene
//     scene.add(map)
//     console.log("🗺️ MAP LOADED")
// })

// /* ================= LOAD PLAYER ================= */
// loader.load("/models/android.glb", (gltf) => {
//     player = gltf.scene
//     window.player = player

//     console.log("MODEL:", player)
//     console.log("ANIMATIONS:", gltf.animations)

//     /* ===== RESET transform từ file gốc ===== */
//     player.position.set(0, 0, 0)
//     player.rotation.set(0, 0, 0)
//     player.scale.set(1, 1, 1)

//     /* ===== AUTO FIT SIZE ===== */
//     const box = new THREE.Box3().setFromObject(player)
//     const size = box.getSize(new THREE.Vector3())

//     const maxDim = Math.max(size.x, size.y, size.z)
//     const scale = 2 / maxDim
//     player.scale.setScalar(scale)

//     /* ===== ĐẶT LÊN MẶT ĐẤT ===== */
//     const newBox = new THREE.Box3().setFromObject(player)
//     player.position.y = -newBox.min.y

//     scene.add(player)
//     console.log("🧍 PLAYER ADDED")

//     /* ===== CAMERA NHÌN TRÚNG PLAYER ===== */
//     controls.target.set(0, 1, 0)
//     camera.position.set(0, 2, 5)
//     controls.update()

//     /* ===== PLAY ANIMATION ===== */
//     if (gltf.animations.length > 0) {
//         mixer = new THREE.AnimationMixer(player)
//         mixer.clipAction(gltf.animations[0]).play()
//     }
// })


// /* ================= LOOP ================= */
// function animate() {
//     requestAnimationFrame(animate)

//     const delta = clock.getDelta()
//     if (mixer) mixer.update(delta)

//     renderer.render(scene, camera)
// }
// animate()

// /* ================= RESIZE ================= */
// window.addEventListener("resize", () => {
//     camera.aspect = window.innerWidth / window.innerHeight
//     camera.updateProjectionMatrix()
//     renderer.setSize(window.innerWidth, window.innerHeight)
// })

//////////////

import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

/* ================= SCENE ================= */
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)

/* ================= CAMERA ================= */
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 2, 6)

/* ================= RENDERER ================= */
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

/* ================= LIGHT ================= */
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))

const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(5, 10, 7)
scene.add(dirLight)

/* ================= CONTROLS ================= */
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 1, 0)
controls.update()

/* ================= CLOCK ================= */
const clock = new THREE.Clock()
let mixer = null
let idleAction = null
let walkAction = null

/* ================= PLAYER ================= */
let player = null

/* ================= INPUT ================= */
const keys = {}
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true))
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false))

/* ================= LOADER ================= */
const loader = new GLTFLoader()

/* ================= LOAD MAP ================= */
loader.load("/models/map.glb", (gltf) => {
    scene.add(gltf.scene)
})

/* ================= LOAD PLAYER ================= */
loader.load("/models/animation.glb", (gltf) => {
    player = gltf.scene

    /* reset transform */
    player.position.set(0, 0, 0)
    player.rotation.set(0, 0, 0)
    player.scale.set(1, 1, 1)

    /* auto scale */
    const box = new THREE.Box3().setFromObject(player)
    const size = box.getSize(new THREE.Vector3())
    const scale = 2 / Math.max(size.x, size.y, size.z)
    player.scale.setScalar(scale)

    /* đặt lên mặt đất */
    const newBox = new THREE.Box3().setFromObject(player)
    player.position.y = -newBox.min.y

    scene.add(player)

    /* animation */
    if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(player)

        idleAction = mixer.clipAction(gltf.animations[0])
        idleAction.play()

        if (gltf.animations[1]) {
            walkAction = mixer.clipAction(gltf.animations[1])
        }
    }
})

/* ================= MOVE CONFIG ================= */
const speed = 3

function updateMovement(delta) {
    if (!player) return

    let moveX = 0
    let moveZ = 0

    // WASD
    if (keys["w"]) moveZ -= 1
    if (keys["s"]) moveZ += 1
    if (keys["a"]) moveX -= 1
    if (keys["d"]) moveX += 1

    // Arrow keys
    if (keys["arrowup"]) moveZ -= 1
    if (keys["arrowdown"]) moveZ += 1
    if (keys["arrowleft"]) moveX -= 1
    if (keys["arrowright"]) moveX += 1

    const isMoving = moveX !== 0 || moveZ !== 0

    if (isMoving) {
        const dir = new THREE.Vector3(moveX, 0, moveZ).normalize()

        // di chuyển
        player.position.x += dir.x * speed * delta
        player.position.z += dir.z * speed * delta

        // xoay theo hướng đi
        const angle = Math.atan2(dir.x, dir.z)
        player.rotation.y = angle

        // animation walk
        if (walkAction && !walkAction.isRunning()) {
            idleAction?.fadeOut(0.2)
            walkAction.reset().fadeIn(0.2).play()
        }
    } else {
        // animation idle
        if (walkAction && walkAction.isRunning()) {
            walkAction.fadeOut(0.2)
            idleAction?.reset().fadeIn(0.2).play()
        }
    }
}

/* ================= LOOP ================= */
function animate() {
    requestAnimationFrame(animate)

    const delta = clock.getDelta()

    if (mixer) mixer.update(delta)
    updateMovement(delta)

    renderer.render(scene, camera)
}
animate()

/* ================= RESIZE ================= */
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})
