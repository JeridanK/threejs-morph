  // Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Append to #canvas-container
const container = document.querySelector('#canvas-container');
if (container) {
  container.appendChild(renderer.domElement);
} else {
  console.error('Error: #canvas-container not found in the DOM. Check your Webflow ID.');
  document.body.appendChild(renderer.domElement); // Fallback
}
camera.position.z = 5;

// Particle cloud
const particleCount = 1000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const originalPositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 10;
  originalPositions[i] = positions[i];
}
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Custom particle texture
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(16, 16, 14, -Math.PI / 2, 0, false);
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 4;
  ctx.stroke();
  return new THREE.CanvasTexture(canvas);
}

const material = new THREE.PointsMaterial({
  size: 0.1,
  map: createParticleTexture(),
  color: 0xFF3D00,
  transparent: true,
  depthWrite: false
});
const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

// Mouse movement
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const targetRotationY = mouseX * 0.2;
  const targetRotationX = mouseY * 0.2;
  particleSystem.rotation.y += (targetRotationY - particleSystem.rotation.y) * 0.05;
  particleSystem.rotation.x += (targetRotationX - particleSystem.rotation.x) * 0.05;
  renderer.render(scene, camera);
}
animate();

// Shape definitions
// SVG-inspired shape: Thin torus with a bisecting cylinder
const svgShapePositions = new Float32Array(particleCount * 3);

// Torus parameters
const torusRadius = 2; // Outer radius of the ring
const tubeRadius = 0.2; // Thickness of the ring
const centerX = 0, centerY = 0, centerZ = 0;

// Cylinder parameters
const cylinderRadius = 0.1; // Thickness of the slash
const cylinderLength = 4 * Math.sqrt(2); // Diagonal length across torus (from (-2, -2) to (2, 2))

// Split particles: 70% for torus, 30% for cylinder
const torusParticleCount = Math.floor(particleCount * 0.7);
const cylinderParticleCount = particleCount - torusParticleCount;

for (let i = 0; i < particleCount; i++) {
  const idx = i * 3;
  let x, y, z;

  if (i < torusParticleCount) {
    // Torus particles
    const theta = Math.random() * 2 * Math.PI; // Angle around the torus
    const phi = Math.random() * 2 * Math.PI; // Angle around the tube
    const r = torusRadius + tubeRadius * Math.cos(phi);
    x = centerX + r * Math.cos(theta);
    y = centerY + r * Math.sin(theta);
    z = centerZ + tubeRadius * Math.sin(phi);

    // Add slight noise for organic look
    x += (Math.random() - 0.5) * 0.1;
    y += (Math.random() - 0.5) * 0.1;
    z += (Math.random() - 0.5) * 0.05;
  } else {
    // Cylinder particles (diagonal slash along y = x)
    const t = Math.random() * 2 - 1; // -1 to 1 along the diagonal
    const diagonalPos = t * torusRadius; // Position along the diagonal line
    x = diagonalPos; // y = x line in X/Y plane
    y = diagonalPos;
    z = centerZ;

    // Add radial noise to form a cylindrical shape
    const angle = Math.random() * 2 * Math.PI;
    const r = cylinderRadius * Math.sqrt(Math.random()); // Uniform distribution within cylinder
    x += r * Math.cos(angle) * Math.sqrt(2) / 2; // Adjust for diagonal orientation
    y += r * Math.sin(angle) * Math.sqrt(2) / 2;
    z += r * Math.sin(angle);

    // Add slight noise for organic look
    x += (Math.random() - 0.5) * 0.1;
    y += (Math.random() - 0.5) * 0.1;
    z += (Math.random() - 0.5) * 0.05;
  }

  svgShapePositions[idx] = x;
  svgShapePositions[idx + 1] = y;
  svgShapePositions[idx + 2] = z;
}

const torusPositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  const idx = i * 3;
  const theta = (i / particleCount) * Math.PI * 0.5;
  const radius = 2;
  const tube = 0.5;
  const r = radius + tube * Math.cos(theta * 4);
  torusPositions[idx] = r * Math.cos(theta);
  torusPositions[idx + 1] = tube * Math.sin(theta * 4);
  torusPositions[idx + 2] = r * Math.sin(theta);
}

const spherePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  const idx = i * 3;
  const phi = Math.acos(-1 + (2 * i) / particleCount);
  const theta = Math.sqrt(particleCount * Math.PI) * phi;
  const radius = 2;
  spherePositions[idx] = radius * Math.cos(theta) * Math.sin(phi);
  spherePositions[idx + 1] = radius * Math.sin(theta) * Math.sin(phi);
  spherePositions[idx + 2] = radius * Math.cos(phi);
}

// GSAP ScrollTrigger with smooth transitions
gsap.registerPlugin(ScrollTrigger);

// Function to interpolate between two sets of positions
function lerpPositions(startPos, endPos, progress) {
  const result = new Float32Array(startPos.length);
  for (let i = 0; i < startPos.length; i++) {
    result[i] = startPos[i] + (endPos[i] - startPos[i]) * progress;
  }
  return result;
}

// Store all shape states
const shapes = [
  originalPositions,
  svgShapePositions, // Updated to torus with bisecting cylinder
  torusPositions,
  spherePositions
];

// Main animation timeline
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.5, // Smoothness of the scrub
    onUpdate: (self) => {
      const progress = self.progress; // 0 to 1
      const positions = particleSystem.geometry.attributes.position.array;
      
      // Calculate which segment we're in and local progress
      const segmentCount = shapes.length - 1;
      const segmentProgress = progress * segmentCount;
      const segmentIndex = Math.floor(segmentProgress);
      const localProgress = segmentProgress - segmentIndex;
      
      // Ensure we don't go out of bounds
      if (segmentIndex >= segmentCount) {
        gsap.to(positions, {
          endArray: shapes[segmentCount],
          duration: 0.1,
          onUpdate: () => particleSystem.geometry.attributes.position.needsUpdate = true
        });
        return;
      }

      // Interpolate between current and next shape
      const currentShape = shapes[segmentIndex];
      const nextShape = shapes[segmentIndex + 1];
      const interpolatedPositions = lerpPositions(currentShape, nextShape, localProgress);
      
      // Apply the interpolated positions
      for (let i = 0; i < positions.length; i++) {
        positions[i] = interpolatedPositions[i];
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
    }
  }
});

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});