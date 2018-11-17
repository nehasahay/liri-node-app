"use strict";

require("dotenv").config();
const request = require("request");
const moment = require("moment");
const fs = require("fs");
const Spotify = require("node-spotify-api");
const keys = require("./keys.js");
const spotify = new Spotify(keys.spotify);
const operation = process.argv[2];
const input = process.argv.slice(3).join(" ");

/**
 * Outputs results to both the console and a log file
 */
(() => {
    let trueLog = console.log;
    // Appends the command given
    fs.appendFile("log.txt", `node liri.js ${operation} ${input}\n`, err => {
        if (err) {
            return trueLog(err);
        };
    });
    // Handles the result data
    console.log = message => {
        fs.appendFileSync("log.txt", `${message}\n`, err => {
            if (err) {
                return trueLog(err);
            };
        });
        trueLog(message);
    };
})();

/**
 * Gets the latest events for the provided artist
 * node liri.js concert-this <artist/band name here>
 */
const concertThis = artist => {
    request(`https://rest.bandsintown.com/artists/${artist}/events?app_id=codingbootcamp`, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            // Exits the function if no events were found
            if (!JSON.parse(body).length) {
                return console.log("No concerts found!\n" + "-".repeat(80));
            };
            JSON.parse(body).forEach(event => {
                console.log("-".repeat(80));
                console.log(`Venue: ${event.venue.name}`);
                console.log(`Location: ${event.venue.city}, ${event.venue.region ? event.venue.region : event.venue.country}`);
                console.log(`Date: ${moment(event.datetime).format("MM/DD/YYYY")}`);
            });
            console.log("-".repeat(80));
        };
    });
};

/**
 * Gets information about the provided song
 * node liri.js spotify-this-song '<song name here>'
 */
const spotifyThisSong = song => {
    song = song || "The Sign by Ace of Base";
    spotify.search({ type: "track", query: song }, (err, data) => {
        if (err) {
            return console.log(err);
        };
        data.tracks.items.forEach(track => {
            // Ignores tracks that don't have a preview
            if (track.preview_url) {
                console.log("-".repeat(80));
                console.log(`Artist: ${track.artists[0].name}`);
                console.log(`Song: ${track.name}`);
                console.log(`Preview: ${track.preview_url}`);
                console.log(`Album: ${track.album.name}`);
            };
        });
        console.log("-".repeat(80));
    });
};

/**
 * Gets information about the provided movie
 * node liri.js movie-this '<movie name here>'
 */
const movieThis = movie => {
    movie = movie || "Mr. Nobody";
    request(`http://www.omdbapi.com/?t=${movie}&apikey=trilogy`, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            console.log("-".repeat(80));
            console.log(`Title: ${JSON.parse(body).Title}`);
            console.log(`Year: ${JSON.parse(body).Year}`);
            console.log(`IMDB: ${JSON.parse(body).Ratings[0] ? JSON.parse(body).Ratings[0].Value : "N/A"}`);
            console.log(`Rotten Tomatoes: ${JSON.parse(body).Ratings[1] ? JSON.parse(body).Ratings[1].Value : "N/A"}`);
            console.log(`Country movie was produced: ${JSON.parse(body).Country}`);
            console.log(`Language: ${JSON.parse(body).Language}`);
            console.log(`Plot: ${JSON.parse(body).Plot}`);
            console.log(`Actors: ${JSON.parse(body).Actors}`);
            console.log("-".repeat(80));
        };
    });
};

/**
 * Uses a file to call the above functions
 * node liri.js do-what-it-says
 */
const doWhatItSays = () => {
    fs.readFile("random.txt", "utf8", (err, data) => {
        if (err) {
            return console.log(err);
        };
        const dataArr = data.split(",");
        const functionList = {
            "concert-this": artist => { concertThis(artist) },
            "spotify-this-song": song => { spotifyThisSong(song) },
            "movie-this": movie => { movieThis(movie) }
        };
        functionList[dataArr[0]](dataArr[1]);
    });
};

/**
 * Executes a function based on the input read from the command line
 */
switch (operation) {
    case "concert-this":
        concertThis(input);
        break;
    case "spotify-this-song":
        spotifyThisSong(input);
        break;
    case "movie-this":
        movieThis(input);
        break;
    case "do-what-it-says":
        doWhatItSays(input);
        break;
    default:
        console.log("Invalid syntax! " +
            "The following operations are supported:\n" +
            "   * node liri.js concert-this <artist/band name here>\n" +
            "   * node liri.js spotify-this-song '<song name here>'\n" +
            "   * node liri.js movie-this '<movie name here>'\n" +
            "   * node liri.js do-what-it-says");
};