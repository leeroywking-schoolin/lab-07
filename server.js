'use strict'

// Load environment variables
require('dotenv').config();

//Load express to do the heavey lifting
const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors'); //Cross Origin Resource Sharing
const pg = require('pg');


app.use(cors()); //tell express to use cors

const PORT = process.env.PORT;


// database url syntax
//MAC: DATABASE_URL=postgres://localhost:5432/city_explorer
// brew services start postgresql if its not running
//WINDOWS: DATABASE_URL=postgresql://<user-name>:<password>/@localhost:5432/city_explorer

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.log(err));

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));

app.get('/location', searchToLatLong);


app.get('/testing', (request, response) => {
  console.log('found the testing route')
  response.send('<h1>HELLO WORLD..</h1>')
});

app.get('/weather', getWeather);

app.get('/events', getEvents) 


//Helper Functions


function searchToLatLong(req, res) {
  let query = req.query.data;
  // define this for sql
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let values = [query];
  // make the query
  client.query(sql, values)
    .then(result => {
      // did the database return any info?
      if (result.rowCount > 0) {
        console.log(`result from database ${result.rows[0]}`);
        res.send(result.rows[0]);
      }
      else {
        console.log('made it the else in the client query')
        // otherwise go get the info from the api
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

        superagent.get(url)
          .then(result => {
            if (!result.body.results.length) { throw 'NO DATA' }
            else {
              const location = new Location(query, result);
              let newSQL = `INSERT INTO locations (search_query, formatted_address, latitude, longitude) VALUES ($1,$2,$3,$4) RETURNING ID;`;
              let newValues = Object.values(location);
              client.query(newSQL, newValues)
                .then(data => {
                  // attach returning id to the location object
                  location.id = data.rows[0].id;
                  res.send(location);
                })
            };
          })
          .catch(err => handleError(err, res));
      }
    })
}
function getWeather(request, response) {
  let query = request.query.data.id;
  // define this for sql
  let sql = `SELECT * FROM weathers WHERE location_id=$1;`;
  let values = [query];

  client.query(sql, values)
    .then(result => {
      if (result.rowCount > 0) {
        response.send(result.rows[0]);
      }
      else {
        const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

        superagent.get(url)
          .then(result => {
            console.log('weather from api ');
            if (!result.body.daily.data.length) { throw 'NO DATA' }
            else {
              const weatherResponse = result.body.daily.data.map(day => {
                let summary = new Weather(day);
                summary.id = query;

                // still building the SQL query
                let newSQL = `INSERT INTO WEATHERS (forecast, time, location_id) VALUES($1,$2,$3);`;
                let newValues = Object.values(summary);
                client.query(newSQL, newValues)
                return summary
                // I believe this is done
              });
              response.send(weatherResponse)
            }
          })
          .catch(err => handleError(err, response));
      }
    })
}
function getEvents( request, response){
  let query = request.query.data.id;
  let sql = `SELECT * FROM events WHERE location_id=$1;`;
  let values = [query];
  client.query(sql,values)
  .then(result => {
    if(result.rowCount > 0){
      response.send(result.rows[0]);
    }
    const url = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&expand=venue&token=${process.env.EVENTBRITE_API_KEY}`;

    superagent.get(url)
    .then(result => {
      if (!result.body.events.length){throw 'NO DATA'}
      else {
        const eventResponse = result.body.events.map(result => {
          const newEvent = new Events(result);
          newEvent.id = query;
          let newSQL = `INSERT INTO EVENTS (eventdata, link, event_data, summary, location_id) VALUES($1,$2,$3,$4,$5);`;
          let newValue = Object.values(newEvent);
          client.query(newSQL, newValue)
          return newEvent
        });
        response.send(eventResponse.slice(0, 20));
      }
    })
    .catch(err => handleError(err, response));
    })
}

// Constructors


function Location(query, res) {
  this.search_query = query
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function Events(query) {
  this.eventData = query.events;
  this.link = query.url;
  this.name = query.name.text;
  this.event_date = query.start.local.slice(0, 10);
  this.summary = query.summary;
}

function Weather(banana) {
  this.forecast = banana.summary;
  this.time = new Date(banana.time * 1000).toString().slice(0, 15);
}



function handleError(err, response) {
  console.error(err);
  if (response) response.status(500).send('nope');
}