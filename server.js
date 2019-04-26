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
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`
  
  superagent.get(url)
  .then(result => {
    const location = new Location(request.query.data, result) 
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

app.get('/events', (request, response) => {
  const url = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&expand=venue&token=${process.env.EVENTBRITE_API_KEY}`;
  superagent.get(url)
  .then(result => {
    const eventResponse = result.body.events.map( result => new Events(result));
    response.send(eventResponse.slice(0,20)) 
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

function Events(query){
  this.eventData = query.events;
  this.link = query.url;
  this.name = query.name.text;
  this.event_date = query.start.local.slice(0,10);
  this.summary = query.summary;
}

function Weather(banana) {
  this.forecast = banana.summary;
  this.time =  new Date(banana.time * 1000).toString().slice(0, 15);
}


function handleError(err, response) {
  console.error(err);
  if (response) response.status(500).send('nope');
}