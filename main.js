import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import * as CANNON from 'cannon-es'
import Stats from 'three/examples/jsm/libs/stats.module'



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
const controls = new OrbitControls(camera, renderer.domElement)
const world = new CANNON.World()
const stats = Stats()
var cubeBody, cubeMesh, planeBody, planeMesh
var balls = []
var walls = []


  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement)

  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25

  camera.position.set(0,500,700)

  world.gravity.set(0, -9.82, 0)



  // Lights
    let pointlight = new THREE.PointLight(0xffffff, 1)
    pointlight.position.set(0, 20, 0)
    scene.add(pointlight)

  //Helpers
    //scene.add(new THREE.AxesHelper(500))
    scene.add( new THREE.GridHelper(10000, 1000))
    //scene.add( new THREE.PointLightHelper(pointlight, 5 ));
    document.body.appendChild(stats.dom)

  //Objects

    let envmaploader = new THREE.PMREMGenerator(renderer)
    new RGBELoader().setPath('textures/').load('cayley_interior_4k.hdr', function(hdrmap){
      let envmap = envmaploader.fromCubemap(hdrmap)
      let texture = new THREE.CanvasTexture(new FlakesTexture())
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.x = 10
      texture.repeat.y = 60
      
      for(var i = 0; i < 1000; i++){
        const ballMaterial = {
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          metalness: 0.9,
          roughness: 0.3,
          color: Math.random() * 0xffffff,
          normalMap: texture,
          normalScale: new THREE.Vector2(0.1, 0.1),
          envMap: envmap.texture
        }
        
        let ballGeo = new THREE.SphereGeometry(10, 64, 64)
        let ballMat = new THREE.MeshPhysicalMaterial(ballMaterial)
        let ballMesh = new THREE.Mesh(ballGeo, ballMat)
        ballMesh.castShadow = true
        ballMesh.position.y = 50
        scene.add(ballMesh)
        const sphereShape = new CANNON.Sphere(10)
        const sphereBody = new CANNON.Body({ mass: 1 })
        sphereBody.addShape(sphereShape)
        sphereBody.position.x = ballMesh.position.x
        sphereBody.position.y = ballMesh.position.y
        sphereBody.position.z = ballMesh.position.z
        world.addBody(sphereBody)

        var ball = [ballMesh, sphereBody]
        balls.push(ball)
      }

      balls.forEach(ball => {
        ball[1].position.x = Math.random() * 1000 - 500
        ball[1].position.y = 500 + Math.random() * 1000 - 500
        ball[1].position.z = Math.random() * 1000 - 500
        console.log(ball)

      });

      const cubeGeometry = new THREE.BoxGeometry(1000, 50, 20)
      cubeMesh = new THREE.Mesh(cubeGeometry, new THREE.MeshBasicMaterial({color: 0xff0000}))
      cubeMesh.castShadow = true
      cubeMesh.position.y = 5
      scene.add(cubeMesh)
      const cubeShape = new CANNON.Box(new CANNON.Vec3(500, 0.5, 5))
      cubeBody = new CANNON.Body({ mass: 0 })
      cubeBody.addShape(cubeShape)
      cubeBody.position.x = cubeMesh.position.x
      cubeBody.position.y = cubeMesh.position.y
      cubeBody.position.z = cubeMesh.position.z
      world.addBody(cubeBody)

      const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
      planeMesh = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial())
      planeMesh.rotateX(-Math.PI / 2)
      planeMesh.receiveShadow = true
      scene.add(planeMesh)
      const planeShape = new CANNON.Plane()
      planeBody = new CANNON.Body({ mass: 0 })
      planeBody.addShape(planeShape)
      planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
      world.addBody(planeBody)
    })




const clock = new THREE.Clock()
let delta

let x = 0,z = 0


function animate() {

  //console.log(balls)
  delta = Math.min(clock.getDelta(), 0.05)
  world.step(delta)

  x = x + delta
  z = z + delta
    pointlight.position.set(
      Math.cos(x) * 50,pointlight.position.y,
      Math.sin(z) * 50
    )

    balls.forEach(element => {
      if(element[0] && element[1]){
        element[0].position.set(
          element[1].position.x,
          element[1].position.y,
          element[1].position.z
          )
        element[0].quaternion.set(
          element[1].quaternion.x,
          element[1].quaternion.y,
          element[1].quaternion.z,
          element[1].quaternion.w
          )
      }
    });


    if(cubeBody && cubeMesh){
      cubeMesh.rotateY(0.01)
      cubeBody.position.set(
        cubeMesh.position.x,
        cubeMesh.position.y,
        cubeMesh.position.z
      )
      cubeBody.quaternion.set(
        cubeMesh.quaternion.x,
        cubeMesh.quaternion.y,
        cubeMesh.quaternion.z,
        cubeMesh.quaternion.w
      )
    }


  requestAnimationFrame(animate);
  controls.update()
  stats.update()
  renderer.render(scene, camera);
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera);
}


animate();