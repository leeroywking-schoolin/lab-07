'use strict'

// Load environment variables
require('dotenv').config();

//Load express to do the heavey lifting
const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors'); //Cross Origin Resource Sharing

app.use(cors()); //tell express to use cors

const PORT = process.env.PORT;


app.get('/location', searchToLatLong);

app.listen(PORT, ()=>console.log(`Listening on PORT ${PORT}`));

function searchToLatLong(request, response){
  console.log('this function has been called');
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`
  console.log(request.query.data);
  
  superagent.get(url)
  .then(result => {
    // console.log(result.body.results);
    const location = new Location(request.query.data, result) 
    // console.log(location);
    response.send(location); })
    .catch(err => handleError(err, response));
  }
  
  
  
  app.get('/testing', (request, response)=>{
    console.log('found the testing route')
    response.send('<h1>HELLO WORLD..</h1>')
  });

app.get('/weather', (request, response)=>{
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  superagent.get(url)
    .then(result => {
      const weatherResponse = result.body.daily.data.map(day => new Weather(day));
      response.send(weatherResponse)
    })
    .catch(err => handleError(err, response));
});




//Helper Functions

// Constructor for location data

function Location(query, res) {
  this.search_query = query
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}
function searchWeather(query){
  console.log('here is the query ' +query);
  // const latlong = query[0].
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${latlong}`
  // const darkskyData = require('./data/darksky.json');
  // const forecast = darkskyData.daily.data.map(apple => new Weather(apple));

  // return forecast;
}

function Weather(banana) {
  this.forecast = banana.summary;
  this.time =  new Date(banana.time * 1000).toString().slice(0, 15);
}
function handleError(err, response) {
  console.error(err);
  if (response) response.status(500).send('nope');
}