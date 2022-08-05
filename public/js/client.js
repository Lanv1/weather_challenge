const socket = io();

//Client setup
socket.on('connect', function(){
    console.log(`You just connected as ${socket.id}.`);
});