const THREE = require('three/');
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const socket = io();

const cityElement = document.querySelector(".cityName");
const countryElement = document.querySelector(".countryName");
const temperatureElement = document.querySelector(".cityTemp");


//Client setup
socket.on('connect', function() {
    console.log(`You just connected as ${socket.id}.`);
    
    //Both events (on connection and on new city) emitted by serv are handled the same way.
    socket.onAny(function(eventname, res) {
        cityElement.textContent = res.city;
        countryElement.textContent = res.country;
        temperatureElement.textContent = res.temperature;
        console.log(res);
    });
});



//THREEjs [TODO refactor, cleaning]
const canvas = document.querySelector(".webgl");

const renderer = new THREE.WebGLRenderer( {
    canvas : canvas,
    antialias : true,
    cullFaceFrontBack : true
});

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 100);

const scene = new THREE.Scene();


//init
scene.background = new THREE.Color('black');
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

let ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
let dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
scene.add(dirLight);
scene.add(ambientLight);

camera.position.z = 10;


const Gltfloader = new GLTFLoader();
renderer.outputEncoding = THREE.sRGBEncoding;
Gltfloader.load('../assets/light_bulb.glb', function(gltf){
    let lightBulb = gltf.scene.children[0];
    
    //Textpos in mesh imported.
    let textPos = lightBulb.children[0].children[1].children[2].position;

    console.log(lightBulb);
    scene.add(lightBulb);
    
    renderer.render(scene, camera);
});
