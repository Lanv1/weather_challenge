const socket = io();

const cityElement = document.querySelector(".cityName");
const countryElement = document.querySelector(".countryName");

//Client setup
socket.on('connect', function() {
    console.log(`You just connected as ${socket.id}.`);

    //Both events (on connection and on new city) emitted by serv are handled the same way.
    socket.onAny(function(eventname, res) {
        cityElement.textContent = res.city;
        countryElement.textContent = res.country;
        console.log(res);
    });
});