const THREE = require('three/');
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const socket = io();

const cityElement = document.querySelector(".cityName");
const countryElement = document.querySelector(".countryName");
const temperatureElement = document.querySelector(".cityTemp");
const canvas = document.querySelector(".webgl");

let cityDesc;

//Returns alpha value for light interpolation
function getAlpha(temperature, max, min) {
    let step = 1 / max;

    //clamp temperature
    let temp = temperature > max ? max : temperature < min ? 0 : temperature - min;
    return  step * temp;
}



//THREEJS misc [TODO refactor]
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 1000);

let bulb = new THREE.Group();
let crank = new THREE.Group();

const red = new THREE.Color(0xff0000);

const renderer = new THREE.WebGLRenderer( {
    canvas : canvas,
    antialias : true,
    cullFaceFrontBack : true
});


//init
scene.background = new THREE.Color('#353535');
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

//lights
let ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
let dirLight = new THREE.DirectionalLight(0xffffff, 1);
let ptLight = new THREE.PointLight(new THREE.Color(0xffffff), 4, 2, 0.5);
ptLight.power = 300;

scene.add(dirLight);
scene.add(ambientLight);
bulb.add(ptLight);


camera.position.z = 10;
renderer.outputEncoding = THREE.LinearEncoding;

scene.add(bulb);
scene.add(crank);
bulb.position.set(4, 0, 0);
// crank.position.set(3, 0, 0);

let mustRotate = false;
let targetQuat = new THREE.Quaternion();
let past = 0;
let current;
const animation = function() {

    current = Date.now();
    let dt = current - past;
    dt *= 0.001;
    past = current;

    bulb.position.y = 1;
    bulb.rotation.y = Math.sin(current * 0.001) * 0.5;

    if(mustRotate) {
        if(!crank.children[0].quaternion.equals(targetQuat)){
            console.log("ici");
            crank.children[0].quaternion.rotateTowards(targetQuat, dt);
        }else{
            mustRotate = false;
            // targetQuat.multiply(crank.children[0].quaternion);
            // crank.children[0].quaternion.identity();
        }
    }
    // crank.children[0].rotation.y += Math.PI * 0.001;

    renderer.render(scene, camera);
    window.requestAnimationFrame(animation);
}

//Mesh loading.
const Gltfloader = new GLTFLoader();
renderer.outputEncoding = THREE.sRGBEncoding;
Gltfloader.load('../assets/light_bulb_crank.glb', function(gltf){

    console.log(gltf);
    camera.updateMatrixWorld();
    let lightBulb = gltf.scene.children[0];
    let crankMesh = gltf.scene.children[1];
    crank.add(crankMesh);
    bulb.add(lightBulb);
    lightBulb.material.depthWrite = true;
    
    //Textpos in mesh imported.
    // let textPos = lightBulb.children[0].children[1].children[2].position;
    // console.log(`textPos`);
    // console.log(textPos);
    
    // let ndc = textPos.clone();
    // let normalized = ndc.project(camera);

    // normalized.x = (normalized.x + 1) / 2 * innerWidth;
    // normalized.y = -(normalized.y - 1) / 2 * innerHeight;
    // // ndc.project(camera);

    // console.log("NORMALIZED POS OF TEXT");
    // console.log(normalized);

    // let planeGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
    // let planeMat = new THREE.MeshBasicMaterial({color:0x00ff00});
    // let plane = new THREE.Mesh(planeGeo, planeMat);
    // scene.add(plane);
    // plane.position.set(ndc.x, ndc.y, ndc.z);

    // console.log(`NDC`);
    // console.log(ndc);
    // const translateX = ((ndc.x + 1) *window.innerWidth/4);
    // const translateY = -(ndc.y + 1) * window.innerHeight/2;

    // console.log(`TRANSLATIONS: X ${translateX}, Y ${translateY}`)
    // temperatureElement.style.left = `${normalized.x}px`;
    // temperatureElement.style.top = `${normalized.y}px`;

    animation();
    console.log(lightBulb);
});

//Test only
window.addEventListener('click', function(ev) {
    console.log(`clicked at ${ev.x}, ${ev.y}`);
    if(!targetQuat.equals( new THREE.Quaternion())){
        targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(120)));
    }else{

        targetQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(120));
    }

    mustRotate = true;
});

window.addEventListener('wheel',  function(ev) {
    console.log(`clicked at ${ev.x}, ${ev.y}`);
    if(!targetQuat.equals( new THREE.Quaternion())){
        targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-120)));
    }else{

        targetQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-120));
    }

    mustRotate = true;
});

//Client setup
socket.on('connect', function() {
    console.log(`You just connected as ${socket.id}.`);
    
    //Both events (on connection and on new city) emitted by serv are handled the same way.
    socket.onAny(function(eventname, res) {
        cityElement.textContent = res.city;
        countryElement.textContent = res.country;
        temperatureElement.textContent = res.temperature + "°C";
        cityDesc = res.description;

        console.log("city description " + cityDesc);

        //Color interpolated (from blue to red) to control warmth.
        ptLight.color.set(
            new THREE.Color(0x0000ff).lerp(red, getAlpha(res.temperature, 30, 10))
        );

    });
});

