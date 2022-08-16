const THREE = require('three/');
import { Mesh } from 'three/';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const socket = io();

const mainElement = document.querySelector(".main");
const cityElement = document.querySelector(".cityName");
const countryElement = document.querySelector(".countryName");
const temperatureElement = document.querySelector(".cityTemp");
const canvas = document.querySelector(".webgl");

let lastDesc = "Rain";
let currentDesc = "Rain";
let crankStates = ["Clear", "Clouds", "Rain"];


//Returns alpha value for light interpolation
const getAlpha = function(temperature, max, min) {
    let step = 1 / max;

    //clamp temperature
    let temp = temperature > max ? max : temperature < min ? 0 : temperature - min;
    return  step * temp;
}

//Rotate crank to next or previous state
const rotateCrank = function(direction, quat) {
    //3 states -> angle = (2*PI / 3)
    let angle = THREE.MathUtils.degToRad(direction * 120);

    if(!quat.equals(new THREE.Quaternion())) {
        quat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle));
    }else{
        quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    }
}

//Correct rotation given last state and current state
const rotateFromTo = function(source, dest, quat) {
    let sourceIndex = crankStates.indexOf(source);
    let destIndex = crankStates.indexOf(dest);

    let direction = (destIndex - sourceIndex);
    if(direction % 2 == 0)
        direction /= -2;

    rotateCrank(direction, quat);
}



//THREEJS misc [TODO refactor]
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 1000);

let bulb = new THREE.Group();
let crank = new THREE.Group();
let bulbPivot = new THREE.Group();

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


//bg plane
let plane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30, 1, 1),
    new THREE.MeshStandardMaterial( {color : 0xffffff})
);

plane.position.set(0, 0, -20);
scene.add(plane);


//lights
let ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
let dirLight = new THREE.DirectionalLight(0xffffff, 1);
let ptLight = new THREE.PointLight(new THREE.Color(0xffffff), 100, 2);
let spotLightCrank = new THREE.SpotLight(0xffffff, 0.8, 0, Math.PI/3, 0.3);
let spotLightState = new THREE.SpotLight(new THREE.Color(0xcceeff), 0.8, 30, Math.PI/6, 0.5, 2);

spotLightState.castShadow = true;
let targetState = plane.position.clone().addScaledVector(new THREE.Vector3(-2, 1, 0), 3);

spotLightState.target.position.set(targetState.x, targetState.y, targetState.z);
// spotLightCrank.target = crank;

ptLight.power = 2000;
spotLightState.power = 10;
spotLightCrank.power = 10;

let indicator = new THREE.Mesh(
    new THREE.SphereBufferGeometry(1),
    new THREE.MeshPhongMaterial({specular : 0xffffff})
);

// crank.add(ptLightCrank);
// ptLightCrank.position.set(0, 10, -2);
    
// scene.add(indicator);
scene.add(dirLight);
scene.add(ambientLight);
scene.add(spotLightCrank);
scene.add(spotLightState);
scene.add(spotLightState.target);

// spotLightCrank.position.set(-1, 0, 0);
indicator.position.set(0.7, -2, -3);


camera.position.z = 10;
renderer.outputEncoding = THREE.sRGBEncoding;

//Move pivot point of lightBulb.
bulbPivot.rotation.order = "YXZ";
bulbPivot.add(bulb);
bulb.translateY(1);

scene.add(bulbPivot);
scene.add(crank);
bulbPivot.position.set(4, 0, 0);

let mustRotate = false;
let targetQuat = new THREE.Quaternion();
let past = 0;
let current;

const animation = function() {

    current = Date.now();
    let dt = current - past;
    dt *= 0.001;
    past = current;

    bulbPivot.rotation.x = Math.PI * current * 0.0001;
    bulbPivot.rotation.y = Math.PI * current * 0.0001;


    if(mustRotate) {
        if(!crank.children[0].quaternion.equals(targetQuat)){
            crank.children[0].quaternion.rotateTowards(targetQuat, dt);
        }else{
            mustRotate = false;
        }
    }

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

    spotLightCrank.target = crankMesh;
    let spotLightPos = crankMesh.position.clone();
    spotLightCrank.position.set(spotLightPos.x, 0, spotLightPos.z);

    //A point light is attached to the bulb.
    lightBulb.add(ptLight);
    lightBulb.material.depthWrite = true;
    lightBulb.material.opacity = 0.5;
    console.log(crankMesh);



    animation();
    console.log(lightBulb);
});

//Client setup
socket.on('connect', function() {
    console.log(`You just connected as ${socket.id}.`);
    
    //Both events (on connection and on new city) emitted by serv are handled the same way.
    socket.onAny(function(eventname, res) {

        // mainElement.style.opacity = 0;
        
        // setTimeout(function() {
        cityElement.textContent = res.city;
        countryElement.textContent = res.country;
        temperatureElement.textContent = res.temperature + "°C";
        lastDesc = currentDesc;
        currentDesc = res.description;
        
        //     mainElement.style.opacity = 1;
        // }, 1000)
        

        //Rare states (mist, thunderstorm, drizzle, ...)
        if(currentDesc === "Thunderstorm"){
            currentDesc = "Rain";
        }else if(!crankStates.includes(currentDesc)) {
            currentDesc = "Clear";
        }

        if(lastDesc !== currentDesc){
            mustRotate = true;
            rotateFromTo(lastDesc, currentDesc, targetQuat);
        }

        //Color interpolated (from blue to red) to control warmth.
        let alpha = getAlpha(res.temperature, 30, 10)
        let colorToUse = new THREE.Color(0x0000ff).lerp(red, alpha);
        // indicator.material.color.set(colorToUse);
        spotLightState.color.lerpColors(
            new THREE.Color(0xffffff),
            colorToUse,
            0.5
        );
        ptLight.color.lerpColors(
            new THREE.Color(0xffffff),
            colorToUse,
            0.8
        );

    });
});

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

