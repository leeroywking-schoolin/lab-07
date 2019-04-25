'use strict'

// Load environment variables
require('dotenv').config();

//Load express to do the heavey lifting
const express = require('express');
const app = express();

const cors = require('cors'); //Cross Origin Resource Sharing

app.use(cors()); //tell express to use cors

const PORT = process.env.PORT;

app.get('/testing', (request, response)=>{
  console.log('found the testing route')
  response.send('<h1>HELLO WORLD..</h1>')

});


app.get('/location', (request, response)=>{
  try{
    const locationData = searchToLatLong(request.query.data);//hat
    response.send(locationData)
  }

  catch(error) {  
    console.error(error);
    response.status(500).send('Status: 500. So sorry, something went Wrong');

  }
})

app.get('/weather', (request, response)=>{
  try{
    console.log('From weather Request', request.query.data.latitude);
    const locationData = searchWeather(request.query.data.latitude);
    response.send(locationData);
  }
  catch(error){
    console.error(error);
    response.status(500).send('Status: 500. So sorry, something went Wrong');
  }

});


app.listen(PORT, ()=>console.log(`Listening on PORT ${PORT}`));


//Helper Functions
function searchToLatLong(query){
  const geoData = require('./data/geo.json');
  const location = new Location(geoData);
  console.log(location);
  return location;
}

// Constructor for location data
function Location(data) {
  this.formatted_query = data.results[0].formatted_address;
  this.latitude = data.results[0].geometry.location.lat;
  this.longitude = data.results[0].geometry.location.lng;
}

function searchWeather(query){
  const darkskyData = require('./data/darksky.json');
  const forecast = [];
  darkskyData.daily.data.forEach(apple => {
    console.log(apple.moonPhase);
    forecast.push(new Weather(apple));
  })

  // console.log(weather);
  return forecast;
}

function Weather(banana) {
  this.forecast = banana.summary;
  this.time =  banana.time;
}
