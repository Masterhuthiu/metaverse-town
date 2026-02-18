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
camera.position.set(0, 5, 10) // Đặt camera ở phía sau (Z dương) để nhìn về 0

/* ================= RENDERER ================= */
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

/* ================= LIGHT ================= */
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(5, 10, 7)
dirLight.castShadow = true
scene.add(dirLight)

/* ================= CONTROLS ================= */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enablePan = false 
controls.enableDamping = true
controls.minDistance = 4
controls.maxDistance = 15

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

// Load Map
loader.load("/models/map.glb", (gltf) => {
    scene.add(gltf.scene)
})

// Load Player
loader.load("/models/Soldier.glb", (gltf) => {
    player = gltf.scene
    player.position.set(0, 0, 0)
    
    // Xoay mặt mặc định của Soldier về đúng hướng
    player.rotation.y = Math.PI 

    // Auto Scale
    const box = new THREE.Box3().setFromObject(player)
    const size = box.getSize(new THREE.Vector3())
    const scale = 2 / Math.max(size.x, size.y, size.z)
    player.scale.setScalar(scale)

    const newBox = new THREE.Box3().setFromObject(player)
    player.position.y = -newBox.min.y

    scene.add(player)

    if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(player)
        idleAction = mixer.clipAction(gltf.animations[0])
        idleAction.play()

        const walkClip = THREE.AnimationClip.findByName(gltf.animations, "Walk") || gltf.animations[3]
        if (walkClip) walkAction = mixer.clipAction(walkClip)
    }
})

/* ================= LOGIC DI CHUYỂN (FIXED) ================= */
const speed = 5

function updateMovement(delta) {
    if (!player) return

    let moveX = 0
    let moveZ = 0

    // Đọc input
    if (keys["w"] || keys["arrowup"]) moveZ -= 1    // Tiến lên (về phía trước camera)
    if (keys["s"] || keys["arrowdown"]) moveZ += 1  // Lùi lại
    if (keys["a"] || keys["arrowleft"]) moveX -= 1  // Sang trái camera
    if (keys["d"] || keys["arrowright"]) moveX += 1 // Sang phải camera

    const isMoving = moveX !== 0 || moveZ !== 0

    if (isMoving) {
        // 1. Lấy hướng của Camera nhưng bỏ qua trục Y (để không đi xuyên xuống đất)
        const cameraAngle = Math.atan2(
            camera.position.x - player.position.x,
            camera.position.z - player.position.z
        )

        // 2. Tính toán vector di chuyển dựa trên góc của Camera
        const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize()
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle)

        // 3. Cập nhật vị trí
        player.position.x += moveDir.x * speed * delta
        player.position.z += moveDir.z * speed * delta

        // 4. Xoay nhân vật nhìn về hướng di chuyển (mượt mà)
        const targetRotationY = Math.atan2(moveDir.x, moveDir.z) + Math.PI
        const targetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetRotationY, 0))
        player.quaternion.slerp(targetQuaternion, 0.15)

        // Animation Walk
        if (walkAction && !walkAction.isRunning()) {
            idleAction?.fadeOut(0.3)
            walkAction.reset().fadeIn(0.3).play()
        }
    } else {
        // Animation Idle
        if (walkAction && walkAction.isRunning()) {
            walkAction.fadeOut(0.3)
            idleAction?.reset().fadeIn(0.3).play()
        }
    }

    // --- CAMERA BÁM ĐUÔI ---
    // Camera bám theo tâm nhân vật
    controls.target.lerp(new THREE.Vector3(player.position.x, player.position.y + 1.5, player.position.z), 0.2)
    controls.update()
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