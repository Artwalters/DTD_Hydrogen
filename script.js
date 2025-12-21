import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js'
import Stats from 'stats.js'

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()
const rgbeLoader = new RGBELoader()
const exrLoader = new EXRLoader()
const textureLoader = new THREE.TextureLoader()

/**
 * Base
 */
// Debug
const gui = new GUI()
const global = {}

// Stats (FPS counter)
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

// Geometry info display
const geometryInfo = document.createElement('div')
geometryInfo.style.position = 'absolute'
geometryInfo.style.top = '48px'
geometryInfo.style.left = '0px'
geometryInfo.style.color = '#00ff00'
geometryInfo.style.backgroundColor = 'rgba(0,0,0,0.8)'
geometryInfo.style.padding = '5px 8px'
geometryInfo.style.fontFamily = 'Helvetica, Arial, sans-serif'
geometryInfo.style.fontSize = '9px'
geometryInfo.style.fontWeight = 'bold'
geometryInfo.innerHTML = 'Triangles: 0 | Vertices: 0'
document.body.appendChild(geometryInfo)

/**
 * Mouse
 */
const mouse = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Environment map
 */
scene.environmentIntensity = 4
scene.backgroundBlurriness = 0
scene.backgroundIntensity = 1
scene.backgroundRotation.y = 0
scene.environmentRotation.y = 2.442

gui.add(scene, 'environmentIntensity').min(0).max(10).step(0.001)
gui.add(scene, 'backgroundBlurriness').min(0).max(1).step(0.001)
gui.add(scene, 'backgroundIntensity').min(0).max(10).step(0.001)
gui.add(scene.backgroundRotation, 'y').min(0).max(Math.PI * 2).step(0.001).name('backgroundRotationY')
gui.add(scene.environmentRotation, 'y').min(0).max(Math.PI * 2).step(0.001).name('environmentRotationY')

// // LDR cube texture
// const environmentMap = cubeTextureLoader.load([
//     '/environmentMaps/2/px.png',
//     '/environmentMaps/2/nx.png',
//     '/environmentMaps/2/py.png',
//     '/environmentMaps/2/ny.png',
//     '/environmentMaps/2/pz.png',
//     '/environmentMaps/2/nz.png'
// ])

// scene.environment = environmentMap
// scene.background = environmentMap

// // HDR (RGBE) equirectangular
// rgbeLoader.load('/environmentMaps/blender-2k.hdr', (environmentMap) =>
// {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping

//     // scene.background = environmentMap
//     scene.environment = environmentMap
// })

// // HDR (EXR) equirectangular
// exrLoader.load('/environmentMaps/nvidiaCanvas-4k.exr', (environmentMap) =>
// {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping

//     scene.background = environmentMap
//     scene.environment = environmentMap
// })

// // LDR equirectangular
// const environmentMap = textureLoader.load('/environmentMaps/blockadesLabsSkybox/anime_art_style_japan_streets_with_cherry_blossom_.jpg')
// environmentMap.mapping = THREE.EquirectangularReflectionMapping
// environmentMap.colorSpace = THREE.SRGBColorSpace
// scene.background = environmentMap
// scene.environment = environmentMap

// Ground projected skybox
rgbeLoader.load('environmentMaps/2/studio_small_09_1k.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.environment = environmentMap

    // Black background
    scene.background = new THREE.Color(0x000000)

    // Skybox
    // const skybox = new GroundedSkybox(environmentMap, 15, 70)
    // skybox.material.wireframe = true
    // skybox.position.y = 15
    // scene.add(skybox)
})

// /**
//  * Real time environment map
//  */
// // Base environment map
// const environmentMap = textureLoader.load('/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg')
// environmentMap.mapping = THREE.EquirectangularReflectionMapping
// environmentMap.colorSpace = THREE.SRGBColorSpace

// scene.background = environmentMap

// // Holy donut
// const holyDonut = new THREE.Mesh(
//     new THREE.TorusGeometry(8, 0.5),
//     new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 4, 2) })
// )
// holyDonut.layers.enable(1)
// holyDonut.position.y = 3.5
// scene.add(holyDonut)

// // Cube render target
// const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
//     256,
//     {
//         type: THREE.FloatType
//     }
// )

// scene.environment = cubeRenderTarget.texture

// // Cube camera
// const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget)
// cubeCamera.layers.set(1)

// /**
//  * Torus Knot
//  */
// const torusKnot = new THREE.Mesh(
//     new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
//     new THREE.MeshStandardMaterial({ roughness: 0, metalness: 1, color: 0xaaaaaa })
// )
// torusKnot.position.x = - 4
// torusKnot.position.y = 4
// scene.add(torusKnot)

/**
 * Models
 */
gltfLoader.load(
    'models/logobutterfly.glb',
    (gltf) =>
    {
        gltf.scene.scale.set(2.5, 2.5, 2.5)
        gltf.scene.position.y = 4
        scene.add(gltf.scene)

        // Adjust material properties for more glossy appearance
        gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.roughness = 0.1  // Lower roughness = more glossy (0 = mirror, 1 = matte)
                child.material.metalness = 0.8  // Higher metalness = more metallic shine
                child.material.needsUpdate = true
            }
        })

        // Store model globally for mouse interaction
        global.butterfly = gltf.scene

        // Add GUI controls for material properties
        const materialSettings = {
            roughness: 0.1,
            metalness: 0.8
        }

        const materialFolder = gui.addFolder('Material')
        materialFolder.add(materialSettings, 'roughness', 0, 1, 0.01).onChange((value) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.roughness = value
                }
            })
        })
        materialFolder.add(materialSettings, 'metalness', 0, 1, 0.01).onChange((value) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.metalness = value
                }
            })
        })

        // Calculate geometry info
        let totalTriangles = 0
        let totalVertices = 0
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry
                if (geometry.index) {
                    totalTriangles += geometry.index.count / 3
                } else {
                    totalTriangles += geometry.attributes.position.count / 3
                }
                totalVertices += geometry.attributes.position.count
            }
        })

        // Update geometry info display
        geometryInfo.innerHTML = `Triangles: ${Math.round(totalTriangles).toLocaleString()} | Vertices: ${totalVertices.toLocaleString()}`
        console.log('Geometry info:', { triangles: Math.round(totalTriangles), vertices: totalVertices })

        // Debug: Check animations
        console.log('Animations found:', gltf.animations.length)
        console.log('Animations:', gltf.animations)

        // Play animation if available
        if(gltf.animations && gltf.animations.length > 0)
        {
            const mixer = new THREE.AnimationMixer(gltf.scene)

            // Play all animations
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip)
                action.play()
            })

            // Store mixer globally to update in tick function
            global.mixer = mixer
        }
    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    const newPixelRatio = Math.min(window.devicePixelRatio, 3)
    renderer.setPixelRatio(newPixelRatio)

    // Update render target with pixel ratio for high-DPI displays
    baseTexture.setSize(sizes.width * newPixelRatio, sizes.height * newPixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)

// Check if mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const cameraDistance = isMobile ? 32 : 18

camera.position.set(cameraDistance, 4, 0)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 4, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
directionalLight.position.set(5, 10, 5)
scene.add(directionalLight)

// Add ambient light for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

/**
 * Post-processing with Render Target
 */
// Render target for the main scene
const pixelRatio = Math.min(window.devicePixelRatio, 3)
const baseTexture = new THREE.WebGLRenderTarget(
    sizes.width * pixelRatio,
    sizes.height * pixelRatio,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    }
)

// Vertex shader for post-processing (passthrough)
const postVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

// Fragment shader for god rays (from fragmentPost.glsl)
const postFragmentShader = `
    uniform float time;
    uniform sampler2D uMap;
    varying vec2 vUv;

    float PI = 3.141592653589793238;

    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        vec4 c = texture2D(uMap, vUv);
        vec2 toCenter = vec2(0.5) - vUv;
        vec4 original = texture2D(uMap, vUv);

        vec4 color = vec4(0.0);
        float total = 0.0;

        for(float i = 0.; i < 20.; i++) {
            float lerp = (i + rand(vec2(gl_FragCoord.x, gl_FragCoord.y)))/20.;
            float weight = sin(lerp * PI);
            vec4 mysample = texture2D(uMap, vUv + toCenter*lerp*0.5);
            mysample.rgb *= mysample.a;
            color += mysample*weight;
            total += weight;
        }

        color.a = 1.0;
        color.rgb /= total;

        // Mix met minder intensiteit
        vec4 finalColor = mix(original, 1. - (1. - color)*(1. - original), 0.25);

        gl_FragColor = finalColor;
    }
`

// Material for post-processing
const materialPost = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        uMap: { value: null }
    },
    vertexShader: postVertexShader,
    fragmentShader: postFragmentShader,
    side: THREE.DoubleSide
})

// Fullscreen quad for post-processing
const meshPost = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialPost)

// Post-processing scene
const scenePost = new THREE.Scene()
scenePost.add(meshPost)

// Orthographic camera for post-processing
const cameraPost = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1000, 1000)

/**
 * Animate
 */
const clock = new THREE.Clock()
const tick = () =>
{
    // Stats begin
    stats.begin()

    // Time
    const deltaTime = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()

    // Update animation mixer
    if(global.mixer)
    {
        global.mixer.update(deltaTime)
    }

    // Mouse interaction with butterfly
    if(global.butterfly)
    {
        // Subtiele positie beweging (tegenovergesteld aan muis)
        const targetX = -mouse.x * 0.5
        const targetY = mouse.y * 0.3

        // Op en neer zweven met sine wave
        const floatY = Math.sin(elapsedTime * 0.5) * 0.2

        global.butterfly.position.x += (targetX - global.butterfly.position.x) * 0.03
        global.butterfly.position.y += (targetY + 4 + floatY - global.butterfly.position.y) * 0.03

        // Subtiele rotatie
        const targetRotationY = mouse.x * 0.1
        const targetRotationX = mouse.y * 0.05

        global.butterfly.rotation.y += (targetRotationY - global.butterfly.rotation.y) * 0.03
        global.butterfly.rotation.x += (targetRotationX - global.butterfly.rotation.x) * 0.03
    }

    // Update controls
    controls.update()

    // First pass: Render main scene to texture
    renderer.setRenderTarget(baseTexture)
    renderer.render(scene, camera)

    // Update post-processing material uniforms
    materialPost.uniforms.uMap.value = baseTexture.texture
    materialPost.uniforms.time.value = elapsedTime

    // Second pass: Render post-processing to screen
    renderer.setRenderTarget(null)
    renderer.render(scenePost, cameraPost)

    // Stats end
    stats.end()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()