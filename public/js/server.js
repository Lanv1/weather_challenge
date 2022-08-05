const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const port = 3000;

//server setup
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile('../index.html');
});

io.on('connection', function(socket){
    console.log(`user ${socket.id} is connected.`);
});

server.listen(port, null, function(){
    console.log(`running on http://localhost:${port}`);
});
