// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });
renderer.setSize(window.innerWidth, window.innerHeight);

// === Lighting ===
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// === Cannon.js Physics ===
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// === Player Car ===
const carGeo = new THREE.BoxGeometry(2, 1, 4);
const carMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const carMesh = new THREE.Mesh(carGeo, carMat);
scene.add(carMesh);

const carBody = new CANNON.Body({
  mass: 100,
  shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2))
});
carBody.position.set(0, 0.5, 0);
world.addBody(carBody);

// === Controls ===
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// === Camera ===
camera.position.set(0, 10, -10);
camera.lookAt(carMesh.position);

// === Procedural Map ===
let mapChunks = {};
let facilityMeshes = [];
let deliveredCount = 0;

function createGroundChunk(x, z) {
  const id = `${x}_${z}`;
  if (mapChunks[id]) return;

  // Ground
  const groundSize = 50;
  const groundGeo = new THREE.BoxGeometry(groundSize, 1, groundSize);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.set(x * groundSize, -0.5, z * groundSize);
  scene.add(groundMesh);

  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(groundSize / 2, 0.5, groundSize / 2)),
    position: new CANNON.Vec3(x * groundSize, -0.5, z * groundSize)
  });
  world.addBody(groundBody);

  mapChunks[id] = { mesh: groundMesh, body: groundBody };

  // Facility (10% chance)
  if (Math.random() < 0.1) {
    const facility = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    facility.position.set(x * groundSize + (Math.random() * 30 - 15), 2, z * groundSize + (Math.random() * 30 - 15));
    scene.add(facility);
    facilityMeshes.push(facility);
  }
}

// === Update Chunks Around Car ===
function updateMap() {
  const range = 2;
  const chunkX = Math.floor(carBody.position.x / 50);
  const chunkZ = Math.floor(carBody.position.z / 50);
  for (let dx = -range; dx <= range; dx++) {
    for (let dz = -range; dz <= range; dz++) {
      createGroundChunk(chunkX + dx, chunkZ + dz);
    }
  }
}

// === Detect Cargo Delivery ===
function checkDelivery() {
  for (let i = 0; i < facilityMeshes.length; i++) {
    const dist = carBody.position.distanceTo(facilityMeshes[i].position);
    if (dist < 3) {
      deliveredCount++;
      console.log("Cargo delivered! Total:", deliveredCount);
      scene.remove(facilityMeshes[i]);
      facilityMeshes.splice(i, 1);
      break;
    }
  }
}

// === Game Loop ===
function animate() {
  requestAnimationFrame(animate);

  // Controls
  if (keys['w']) carBody.velocity.z -= 0.5;
  if (keys['s']) carBody.velocity.z += 0.5;
  if (keys['a']) carBody.velocity.x -= 0.5;
  if (keys['d']) carBody.velocity.x += 0.5;

  world.step(1 / 60);

  // Sync mesh
  carMesh.position.copy(carBody.position);
  carMesh.quaternion.copy(carBody.quaternion);

  // Camera follow
  camera.position.lerp(new THREE.Vector3(
    carMesh.position.x,
    carMesh.position.y + 10,
    carMesh.position.z - 10
  ), 0.1);
  camera.lookAt(carMesh.position);

  updateMap();
  checkDelivery();
  renderer.render(scene, camera);
}

animate();
