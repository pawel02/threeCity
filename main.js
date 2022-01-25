import './style.css';
import './header.css';
import './main.css';
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector';

var mouse = new THREE.Vector2();
let renderer;
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 500);
const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
function onTouchStart( event ) {
  if ( event.touches.length == 1 ) {
      event.preventDefault();
      mouse.x = (event.touches[ 0 ].pageX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.onload = () => {
  if (mediaQuery || !mediaQuery.matches) {
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('touchstart', onTouchStart, false );
  }
  
  window.addEventListener('resize', onWindowResize, false);

  const scene = new THREE.Scene();

  const options = {
    gridAmount: 20,
    buildingAmount: 60,
    scale: 0.8,
    cameraSpeed: 0.3,
    carsAmount: 50
  };


  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#bg"),
    antialias: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  camera.rotation.set(-0.5, 0, 0);
  camera.position.set(0, 15, 12);

  // basic lighting
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 4);

  // Light will always be statically positioned as we are moving the city and not the camera
  var lightFront = new THREE.SpotLight(0xFFFFFF, 10, 80);
  var lightBack = new THREE.PointLight(0xFFFFFF, 1);
  lightBack.position.set(0,6,0);

  lightFront.position.set(5, 30, 10);
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

  // Create the fog
  const fog = 0x9120f0;
  scene.background = new THREE.Color(fog);
  scene.fog = new THREE.Fog(fog, 14, 18);

  const plane = new THREE.BoxGeometry(0.005, 0.005, 1);
  const floorGeometry = new THREE.PlaneGeometry(100, 100);

  let floor = new THREE.Object3D();
  let town = new THREE.Object3D();
  let cars = new THREE.Object3D();
  let city = new THREE.Object3D();
  let particles = new THREE.Object3D();

  // Add the floor
  const floorMat = new THREE.MeshStandardMaterial({color:0xffffff});

  const floorMesh = new Reflector(floorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x777777
  });


  floorMesh.rotation.x    = -90 * Math.PI / 180;
  floorMesh.position.y    = -0.001;
  floorMesh.castShadow    = true;
  floorMesh.receiveShadow = true;
  city.add(floorMesh);

  // Create the lines on the floor
  for (let x = -options.gridAmount; x < options.gridAmount; x++)
  {
    for (let z = -options.gridAmount; z < options.gridAmount; z++)
    {
      const floorSegment = new THREE.Mesh(plane, floorMat);
      const floorSegment2 = new THREE.Mesh(plane, floorMat);  

      floorSegment.receiveShadow = true;
      floorSegment.position.set(x * options.scale, 0, z * options.scale);
      floor.add(floorSegment);

      floorSegment2.receiveShadow = true;
      floorSegment2.position.set(x * options.scale, 0, z * options.scale);
      floorSegment2.rotation.y = -90 * Math.PI / 180;
      floor.add(floorSegment2);
    }
  }

  // Create the town
  const outlineMat =  new THREE.MeshStandardMaterial({color:0x090909, wireframe: true});
  const buildingMat = new THREE.MeshPhongMaterial({color:0x020202, shininess: 100});
  const carMat = new THREE.MeshStandardMaterial({color:0xffff00});

  const cube = new THREE.BoxGeometry(2 * options.scale, 1 * options.scale, 2 * options.scale, 2, 2, 2);
  const carGeo = new THREE.BoxGeometry(0.005, 0.005, 1);

  // Create a list of all possible building positions
  const buildingSize = Math.floor(options.gridAmount - 10) / 2;
  let pairs = [];
  for(let x = -buildingSize; x < buildingSize; x++)
  {
    for(let y = -buildingSize; y < buildingSize; y++)
    {
      pairs.push([x * options.scale * 2, y * options.scale * 2]);
    }
  }

  const mCars = [];
  const carResetLength = options.gridAmount * options.scale;

  for(let x = 0; x < options.carsAmount; x++)
  {
    let car = new THREE.Mesh(carGeo, carMat);

    // Choose a random direciton for the car
    const carDir = Math.floor(Math.random() * 3);
    const carPos = ((Math.floor(Math.random() * buildingSize * 2)) - buildingSize) * 2;
    const speed = (Math.random() * 20) + 10;
    const carY = (Math.random() * 4) + 1;

    if (carDir === 0)
    {
      car.position.set(carPos, carY, -carResetLength);
      mCars.push({
        car,
        speed,
        move: (delta, self) => {
          self.car.position.z += self.speed * delta;
          if (self.car.position.z > carResetLength)
          {
            self.car.position.z = -carResetLength;
          }
        }
      });
    }
    else if (carDir === 1)
    {
      car.position.set(carPos, carY, carResetLength);
      mCars.push({
        car,
        speed,
        move: (delta, self) => {
          self.car.position.z -= self.speed * delta;
          if (self.car.position.z < -carResetLength)
          {
            self.car.position.z = carResetLength;
          }
        }
      });
    }
    else if (carDir === 2)
    {
      car.position.set(carResetLength, carY, carPos);
      car.rotation.y = 90 * Math.PI / 180;
      mCars.push({
        car,
        speed,
        move: (delta, self) => {
          self.car.position.x -= self.speed * delta;
          if (self.car.position.x < -carResetLength)
          {
            self.car.position.x = carResetLength;
          }
        }
      });
    }
    else
    {
      car.position.set(-carResetLength, carY, carPos);
      car.rotation.y = 90 * Math.PI / 180;
      mCars.push({
        car,
        speed,
        move: (delta, self) => {
          self.car.position.x += self.speed * delta;
          if (self.car.position.x > carResetLength)
          {
            self.car.position.x = -carResetLength;
          }
        }
      });
    }

    cars.add(car);
  }

  // Create all the buildings
  for (let i = 0; i < options.buildingAmount; i++)
  {
    let building = new THREE.Mesh(cube, buildingMat);  // The big block sticking out
    let base = new THREE.Mesh(cube, buildingMat);      // The base block that is thin
    let outline = new THREE.Mesh(cube, outlineMat);    // The outline for the main block

    // Scale everything relative to the base block
    base.add(building);
    base.add(outline);

    // Make sure that each building is not intersecting with another
    const randNum = Math.floor(Math.random() * pairs.length);
    let position = pairs[randNum].slice();
    pairs.splice(randNum, 1);

    const scaleY = Math.floor((Math.random() * 60) + 20);

    base.scale.y     = 0.1;
    base.position.y  = 0.05;

    building.scale.y = scaleY;
    building.scale.x = 0.9;
    building.scale.z = 0.9;
    building.castShadow = true;
    building.receiveShadow = true;
    building.position.y  += Math.abs(scaleY * options.scale) / 2;

    outline.scale.y = scaleY;
    outline.scale.x = 0.9;
    outline.scale.z = 0.9;
    outline.castShadow = true;
    outline.receiveShadow = true;
    outline.position.y  += Math.abs(scaleY * options.scale) / 2;

    base.castShadow = true;
    base.receiveShadow = true;

    base.position.x = position[0];
    base.position.z = position[1];
    
    // Add a building into the town
    town.add(base);
  }

  // Add the floor and the buildings into the city
  city.add(floor);
  city.add(town);
  city.add(cars);

  // Create the particles
  let gmaterial = new THREE.MeshToonMaterial({color:0x111111, side:THREE.DoubleSide});
  let gparticle = new THREE.SphereGeometry(0.008);
  let particleMultiple = 10;

  for (var h = 1; h < 600; h++) {
    var particle = new THREE.Mesh(gparticle, gmaterial);
    particle.position.set((Math.random() * particleMultiple) - particleMultiple / 2, (Math.random() * particleMultiple) - particleMultiple / 2, (Math.random() * particleMultiple) - particleMultiple / 2);
    particle.rotation.set(Math.random() * particleMultiple, Math.random() * particleMultiple, Math.random() * particleMultiple);
    particles.add(particle);
  }
  particles.position.y = 2;

  // Add all the objects into the scene
  scene.add(ambientLight, lightFront, lightBack);
  scene.add(city);
  scene.add(particles);

  const clock = new THREE.Clock();
  function animate()
  {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Move the city
    city.rotation.y -= mouse.x * options.cameraSpeed * delta;
    city.rotation.x -= -mouse.y * (options.cameraSpeed * 0.3) * delta;
    if (city.rotation.x < -0.5) city.rotation.x = -0.5;
    else if (city.rotation.x > 0.2) city.rotation.x = 0.2;

    // Move the particles around
    particles.rotation.y += 0.1 * delta;
    particles.rotation.x += 0.1 * delta;

    for (let c of mCars)
    {
      c.move(delta, c);
    }

    // Always look into the middle of the city
    camera.lookAt(city.position.x / 2, city.position.y, city.position.z / 2);

    renderer.render(scene, camera);
  }

  animate();
}

window.onunload = () => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('resize', onWindowResize);
}
