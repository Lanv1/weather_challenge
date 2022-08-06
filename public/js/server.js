const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');


const app = express();
const port = 3000;

//Misc functions
const loadDb = function(filePath){
  return JSON.parse(fs.readFileSync(filePath));
}

const getNextCity = function(dataBase, currentCity = ""){
  let max = dataBase.length;
  let current = currentCity.toLowerCase();
  let cityIndex = Math.floor(Math.random() * max - 1);
  
  while((dataBase[cityIndex].capital).toLowerCase() == current){
    cityIndex = Math.floor(Math.random() * max - 1);
  }

  return dataBase[cityIndex];
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
});

server.listen(port, null, function() {
    console.log(`running on http://localhost:${port}`);
});



//Loading dataSet (country capitals).
const citiesData = loadDb(path.join(__dirname, "../citiesData.json"));

//Query on API (get city weather).
const weatherCityHandler = function(locationData) {
  
  //Get weather data on city from API
  const options = {
    "city": locationData.capital,
    "apiKey": "da0f9c8d90bde7e619c3ec47766a42f4",
    "units": "metric",
  };

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${options.city}&appid=${options.apiKey}&units=${options.units}`;

  https.get(url, function(res) {

    let data = "";
    let result = {
      city : locationData.capital,
      country : locationData.country,
      description : "",
      temperature : ""
    };

    res.on("data", function(chunk) {
      data += chunk;
  
      if(res.statusCode === 404 || res.statusCode == 400) {
        console.log("ERROR " + res.statusCode);

      }else {
        //Parse useful data
        const weather = JSON.parse(data);        
        result.description = weather.weather[0].main;
        result.temperature = weather.main.temp;
        console.log(result);

        //Broadcast new city and weather data to all clients.
        //...[TODO]
      }

    });
  });
}

//test
weatherCityHandler(getNextCity(citiesData));


