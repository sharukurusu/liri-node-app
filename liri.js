require("dotenv").config();
var Spotify = require("./node_modules/node-spotify-api/index")
var keys = require("./keys")
var spotify = new Spotify(keys.spotify);
var request = require("request");
var inquirer = require("inquirer")
var moment = require("moment")
var fs = require("fs");
var figlet = require('figlet');

// Displays Ascii greeting
figlet.text('LIRI', {
    font: 'Big',
    horizontalLayout: 'default',
    verticalLayout: 'default'
}, function(err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log("Hello, I'm:")
    console.log(data);
    console.log("Your virtual assistant!")
    directInput()
});



// takes in direct user input from command line, parses to uri component format
var operation = process.argv[2]
var searchTerm = encodeURIComponent((process.argv.splice(3)).join(" "))

// runs appropriate function for user input or goes to menu if no input is entered
function directInput() {
    if (operation === "spotify-this-song") {
        songSearch(searchTerm)
    }   else if (operation === "concert-this") {
        concertSearch(searchTerm)
    }   else if (operation === "movie-this") {
        movieSearch(searchTerm)
    }   else if (operation === "do-what-it-says") {
        doWhatItSays()
    }   else {
        displayMenu()
    }
}


// Searches for movie info
function movieSearch(movie) {
    // Defaults to Mr. Nobody if nothing is entered
    if (movie === "") {
        movie = "Mr.+Nobody"
    }
    var queryUrl = "http://www.omdbapi.com/?t=" + movie + "&y=&plot=short&apikey=trilogy";
    
    request(queryUrl, function(error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log("--------------------")
        console.log("Title: " + JSON.parse(body).Title)
        console.log("Year: " + JSON.parse(body).Year)
        console.log("IMDB Rating: " + JSON.parse(body).Ratings[0].Value + " | Rotten Tomatoes Rating: " + JSON.parse(body).Ratings[1].Value)
        console.log("Country: " + JSON.parse(body).Country)
        console.log("Language: " + JSON.parse(body).Language)
        console.log("Plot: " + JSON.parse(body).Plot)
        console.log("Starring: " + JSON.parse(body).Actors);
        console.log("--------------------")
        searchAgain()
    }
    });
}

// Searches for concerts
function concertSearch(artist) {
    var queryUrl = "https://rest.bandsintown.com/artists/"+ artist +"/events?app_id=codingbootcamp"

    request(queryUrl, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            // If response is too short, no shows were found
            if (response.body.length < 5){
                console.log("No upcoming shows found for this artist!")
                searchAgain()
            } else {
                // uses lineup info to properly capitalize artist name
                console.log("The next 3 concerts for "+ JSON.parse(body)[0].lineup[0]+ " will be held on:")
                console.log("--------------------")
                // displays first 3 concerts, or less if there aren't that many
                for (let i = 0; (i<3) && (JSON.parse(body).length); i++) {
                    var venue = JSON.parse(body)[i].venue.name.trim()
                    // If there are no states in the country, only display country
                    if (JSON.parse(body)[i].venue.region === ""){
                        var location = JSON.parse(body)[i].venue.city +", "+ JSON.parse(body)[i].venue.country
                    }   else{
                        var location = JSON.parse(body)[i].venue.city +", "+ JSON.parse(body)[i].venue.region +", "+ JSON.parse(body)[i].venue.country
                    }
                    var date = moment(JSON.parse(body)[i].datetime).format("MMMM Do YYYY");
                    var time = moment(JSON.parse(body)[i].datetime).format("h:mm a");

                    console.log(date + " at "+ venue +" in "+ location +" at "+ time );
                    console.log("--------------------")
                }
                searchAgain()
            }
        
        }
    });
}

// Searches for song info
function songSearch(song) {
    // Defaults to Devil Went Down to Georgia if nothing is input
    if (song === "") {
        song = "Devil Went Down to Georgia"
    }
    spotify
        .search({ type: 'track', query: song, limit: 3 })
        .then(function(response) {
            console.log("--------------------")
        for (let i=0; i < 3; i++){
            console.log("Song Title:    " + response.tracks.items[i].name);
            console.log("Artist(s):    " + response.tracks.items[i].artists[0].name);
            console.log("Album:    " + response.tracks.items[i].album.name);
            console.log("Preview Link:    " + response.tracks.items[i].external_urls.spotify);
            console.log("--------------------")
        }
        searchAgain()
    })
    .catch(function(err) {console.log(err);});
} 

// Reads the random.txt file for instructions and reruns directInput function
function doWhatItSays() {
    fs.readFile("random.txt", "utf8", function(error, data) {
        if (error) {return console.log(error);}

        var dataArr = data.split(",");
        operation = dataArr[0]
        searchTerm = dataArr[1]
        directInput()
      });
}

// Inquirer based menu if no direct input is added or if program is running and another search is desired
function displayMenu() {
    inquirer.prompt([{
        type: "list",
        name: "mainMenu",
        message: "What would you like to search for?",
        choices: ["A Song", "A Movie", "Concert Times"]
    }]).then(function(mainMenu){
        if (mainMenu.mainMenu === "A Song"){
            inquirer.prompt([{
                  type: "input",
                  name: "song",
                  message: "What song would you like information on?"
                }]).then(function(song){
                    var song = encodeURIComponent(song.song.trim())
                    songSearch(song)
                })
        }   else if (mainMenu.mainMenu === "A Movie") {
            inquirer.prompt([{
                type: "input",
                name: "movie",
                message: "What movie would you like information on?"
                }]).then(function(movie){
                    var movie = encodeURIComponent(movie.movie.trim())
                    movieSearch(movie)
                })
        }   else if (mainMenu.mainMenu === "Concert Times") {
            inquirer.prompt([{
                type: "input",
                name: "band",
                message: "What band would you like concert times for?"
                }]).then(function(band){
                    var band = encodeURIComponent(band.band.trim())
                    concertSearch(band)
                })
        }
    })
}

// Asks if user wants to search for something else 
function searchAgain(){
    inquirer.prompt([{
        type: "confirm",
        message: "Search for something else?",
        name: "confirm",
        default: true
    }]).then(function(searchAgain){
        if (searchAgain.confirm){
            displayMenu()
        } else {
            console.log("Ok, I'll be here for you any time!")
        }
    })
}