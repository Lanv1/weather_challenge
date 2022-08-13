const THREE = require('three/');
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const socket = io();

const cityElement = document.querySelector(".cityName");
const countryElement = document.querySelector(".countryName");
const temperatureElement = document.querySelector(".cityTemp");

//Returns alpha value for light interpolation
function getAlpha(temperature, max, min) {
    let step = 1 / max;

    //clamp temperature
    let temp = temperature > max ? max : temperature < min ? 0 : temperature - min;
    return  step * temp;
}



//THREEJS misc [TODO refactor]
const scene = new THREE.Scene();
let item = new THREE.Group();


const red = new THREE.Color(0xff0000);

const canvas = document.querySelector(".webgl");

const renderer = new THREE.WebGLRenderer( {
    canvas : canvas,
    antialias : true,
    cullFaceFrontBack : true
});

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 100);


//init
scene.background = new THREE.Color('#353535');
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

let ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
let dirLight = new THREE.DirectionalLight(0xffffff, 1);
let ptLight = new THREE.PointLight(new THREE.Color(0xffffff), 4, 2, 0.5);

scene.add(dirLight);
scene.add(ambientLight);
item.add(ptLight);

ptLight.power = 300;

camera.position.z = 10;
renderer.outputEncoding = THREE.LinearEncoding;

scene.add(item);
item.position.set(3, 0, 0);

let past = 0;
let current;
const animation = function() {

    current = Date.now();
    let dt = current - past;
    dt *= 0.001;
    past = current;

    item.position.y = 1;
    item.rotation.y = Math.sin(current * 0.001) *0.5;

    renderer.render(scene, camera);
    window.requestAnimationFrame(animation);
}

//Mesh loading.
const Gltfloader = new GLTFLoader();
renderer.outputEncoding = THREE.sRGBEncoding;
Gltfloader.load('../assets/light_bulb.glb', function(gltf){
    camera.updateMatrixWorld();
    let lightBulb = gltf.scene.children[0];
    item.add(lightBulb);
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

window.addEventListener('click', function(ev) {
    console.log(`clicked at ${ev.x}, ${ev.y}`);
});

//Client setup
socket.on('connect', function() {
    console.log(`You just connected as ${socket.id}.`);
    
    //Both events (on connection and on new city) emitted by serv are handled the same way.
    socket.onAny(function(eventname, res) {
        cityElement.textContent = res.city;
        countryElement.textContent = res.country;
        temperatureElement.textContent = res.temperature + "°C";

        //Color interpolated (from blue to red) to control warmth.
        ptLight.color.set(
            new THREE.Color(0x0000ff).lerp(red, getAlpha(res.temperature, 30, 10))
        );

    });
});

