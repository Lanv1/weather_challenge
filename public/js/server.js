const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');


const app = express();
const port = 3000;

//Save current data for new clients connecting.
let currentResult = {
  city : "",
  country : "",
  description : "",
  temperature : ""
}

//Misc functions.
const loadDb = function(filePath){
  return JSON.parse(fs.readFileSync(filePath));
}

const getNextCity = function(dataBase, currentCity = ""){
  let max = dataBase.length;
  let current = currentCity.toLowerCase();
  let cityIndex = Math.floor(Math.random() * max);
  
  while((dataBase[cityIndex].capital).toLowerCase() == current){
    cityIndex = Math.floor(Math.random() * max);
  }
  return dataBase[cityIndex];
}


//Loading dataSet (country capitals).
const citiesData = loadDb(path.join(__dirname, "../citiesData.json"));

//Query on API (get city weather) and emit result to clients.
const weatherCityHandler = function(locationData) {
  
  //Get weather data on city from API (remove accents)
  const options = {
    "city": locationData.capital.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    "apiKey": "da0f9c8d90bde7e619c3ec47766a42f4",
    "units": "metric",
  };

  const url = encodeURI(`https://api.openweathermap.org/data/2.5/weather?q=${options.city}&appid=${options.apiKey}&units=${options.units}`);

  https.get(url, function(res) {

    let data = "";
    currentResult.city = locationData.capital;
    currentResult.country = locationData.country;

    res.on("data", function(chunk) {
      data += chunk;
  
      if(res.statusCode === 404 || res.statusCode == 400) {
        console.log("ERROR " + res.statusCode + ", for city " + options.city);
        
      }else {
        //Parse useful data
        const weather = JSON.parse(data);        
        currentResult.description = weather.weather[0].main;
        currentResult.temperature = weather.main.temp;
        console.log(currentResult);

        //Emit new city and weather data to all clients.
        io.emit("newData", currentResult);
      }

    });
  });
}

//Fetch and handle new city informations every 30sec.
const runApp = function() {
  let lastCityInfo = getNextCity(citiesData);
  weatherCityHandler(lastCityInfo);

  setInterval(function() {
    let currentCityInfo = getNextCity(citiesData, lastCityInfo.capital);
    lastCityInfo = currentCityInfo;

    weatherCityHandler(currentCityInfo);
  }, 30000);
}

//Server setup
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile('../index.html');
});

io.on('connection', function(socket) {
  console.log(`user ${socket.id} is connected.`);
  socket.emit("currentData", currentResult);
});

server.listen(port, null, function() {
  console.log(`running on http://localhost:${port}`);
});

runApp();



