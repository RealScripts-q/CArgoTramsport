// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Ground
const groundGeo = new THREE.BoxGeometry(100, 1, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.position.y = -0.5;
scene.add(groundMesh);

// Car
const carGeo = new THREE.BoxGeometry(2, 1, 4);
const carMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const carMesh = new THREE.Mesh(carGeo, carMat);
carMesh.position.y = 0.5;
scene.add(carMesh);

// Cannon physics
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Ground body
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(50, 0.5, 50)),
});
groundBody.position.set(0, -0.5, 0);
world.addBody(groundBody);

// Car body
const carBody = new CANNON.Body({
  mass: 100,
  shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)),
});
carBody.position.set(0, 0.5, 0);
world.addBody(carBody);

// Controls
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Controls: WASD
  if (keys['w']) carBody.velocity.z -= 0.5;
  if (keys['s']) carBody.velocity.z += 0.5;
  if (keys['a']) carBody.velocity.x -= 0.5;
  if (keys['d']) carBody.velocity.x += 0.5;

  world.step(1/60);

  // Sync 3D mesh with physics body
  carMesh.position.copy(carBody.position);
  carMesh.quaternion.copy(carBody.quaternion);

  renderer.render(scene, camera);
}

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

animate();
