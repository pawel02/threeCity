//Try to recreate something like https://codepen.io/vcomics/pen/aGmoae
import './style.css';
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Reflector } from 'three/examples/jsm/objects/Reflector';

const scene = new THREE.Scene();

const options = {
  gridAmount: 20,
  buildingAmount: 50,
  scale: 0.8
};

const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 500);
const controls = new OrbitControls(camera, document.querySelector("#bg"));

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
};

camera.rotation.set(-0.5, 0, 0);
camera.position.set(0, 10, 10);

/*
Geometry:
Add some buildings with random heights made up of simple cubes, these should have wireframe on them

Effects:
add fog with an orange color
try out different particle effects
*/

// basic lighting
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 20);
var lightFront = new THREE.SpotLight(0xFFFFFF, 20, 50);
var lightBack = new THREE.PointLight(0xFFFFFF, 0.5);
lightBack.position.set(0,6,0);

lightFront.position.set(5, 10, 5);
lightFront.rotation.x = 45 * Math.PI / 180;
lightFront.rotation.z = -45 * Math.PI / 180;
lightFront.castShadow = true;
lightFront.penumbra = 0.1;

lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = 6000;
lightFront.shadow.camera.near = 0.1;
lightFront.shadow.camera.far = 2000;
lightFront.shadow.camera.fov = 30;

scene.add(ambientLight, lightFront, lightBack);

// Create the fog
const fog = 0xF02050;
scene.background = new THREE.Color(fog);
scene.fog = new THREE.Fog(fog, 10, 16);

const plane = new THREE.BoxGeometry(0.01, 0.01, 1);
const floorGeometry = new THREE.PlaneGeometry(100, 100);

let floor = new THREE.Object3D();
let town = new THREE.Object3D();
let city = new THREE.Object3D();

// Add the floor
const floorMat = new THREE.MeshStandardMaterial({color:0x000000});

const floorMesh = new Reflector(floorGeometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x777777
});

floorMesh.rotation.x    = -90 * Math.PI / 180;
floorMesh.position.y    = -0.001;
floorMesh.receiveShadow = true;
city.add(floorMesh);

// Create the lines on the floor
for (let x = -options.gridAmount; x < options.gridAmount; x++)
{
  for (let z = -options.gridAmount; z < options.gridAmount; z++)
  {
    let floorSegment = new THREE.Mesh(plane, floorMat);
    floorSegment.receiveShadow = true;
    floorSegment.position.set(x * options.scale, 0, z * options.scale);
    floor.add(floorSegment);

    let floorSegment2 = new THREE.Mesh(plane, floorMat);
    floorSegment2.receiveShadow = true;
    floorSegment2.position.set(x * options.scale, 0, z * options.scale);
    floorSegment2.rotation.y = -90 * Math.PI / 180;
    floor.add(floorSegment2);
  }
}

// Create the town
const outlineMat =  new THREE.MeshStandardMaterial({color:0x010101, wireframe: true});
const buildingMat = new THREE.MeshPhysicalMaterial({color:0x000000, metalness: 0.2, roughness: 0.8});

const cube = new THREE.BoxGeometry(2 * options.scale, 1 * options.scale, 2 * options.scale, 2, 2, 2);

let usedPairs = [];

const buildingSize = Math.floor(options.gridAmount - 10) / 2;
let pairs = [];
for(let x = -buildingSize; x < buildingSize; x++)
{
  for(let y = -buildingSize; y < buildingSize; y++)
  {
    pairs.push([x * options.scale * 2, y * options.scale * 2]);
  }
}
for (let i = 0; i < options.buildingAmount; i++)
{
  let building = new THREE.Mesh(cube, buildingMat);
  let outline = new THREE.Mesh(cube, outlineMat);
  building.add(outline);


  let position = pairs[Math.floor(Math.random() * pairs.length)];
  if (usedPairs.indexOf(position) > -1)
  {
    continue;
  }
  usedPairs.push(position);
  
  const scaleY = Math.floor((Math.random() * 5) + 1);

  building.scale.y     = scaleY;
  building.position.y  += Math.abs(scaleY * options.scale) / 2;
  building.castShadow = true;
  building.receiveShadow = true;

  building.position.x = position[0];
  building.position.z = position[1];
  
  town.add(building);
}

// Add everything into the scene
city.add(floor);
city.add(town);

scene.add(city);
var uSpeed = 0.001;
var mouse = new THREE.Vector2(), INTERSECTED;

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};
function onDocumentTouchStart( event ) {
if ( event.touches.length == 1 ) {
    event.preventDefault();
    mouse.x = event.touches[ 0 ].pageX -  window.innerWidth / 2;
    mouse.y = event.touches[ 0 ].pageY - window.innerHeight / 2;
};
};
function onDocumentTouchMove( event ) {
if ( event.touches.length == 1 ) {
    event.preventDefault();
    mouse.x = event.touches[ 0 ].pageX -  window.innerWidth / 2;
    mouse.y = event.touches[ 0 ].pageY - window.innerHeight / 2;
}
}
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('touchstart', onDocumentTouchStart, false );
window.addEventListener('touchmove', onDocumentTouchMove, false );


function animate()
{
  requestAnimationFrame(animate);

   city.rotation.y -= mouse.x * 0.01;
   city.rotation.x -= -mouse.y * 0.01;
   if (city.rotation.x < -0.5) city.rotation.x = -0.5;
   else if (city.rotation.x > 0.2) city.rotation.x = 0.2;
  
   camera.lookAt(city.position.x / 2, city.position.y, city.position.z / 2);

  renderer.render(scene, camera);
}

animate();

