// Import required libraries 
const express = require('express'); // For web serving
const {spawn} = require('child_process'); // For spawning an instance of 'tail' 
    // to read the log
const readline = require('readline'); // For reading lines of text from a stream
const escape = require('escape-html'); // For escaping html

// Set constants
const app = express(); // Create a new Express app
const port = 3000; // TCP port of web app
const regex = /^(\[\d\d:\d\d:\d\d\] \[.*\]: )((<[^ ]*\>)|([^ ]* (left|joined) the game))|(.*)(shot by|to death|cactus|drowned|experienced kinetic|removed an elytra|blew up|blown up|hit the ground|fell|doomed to fall|shot off|blown|squashed|flames|burned|burnt|fire|bang|lava|lightning|slain by|finished off|fireballed|killed by|starved|suffocated|squished|fell out|withered away|pummeled by|pummeled|died)/; // Log regex; log lines which match this regex will be presented to the user
const http = require('http').Server(app); // Create a HTTP server on the
    // Express app
const io = require('socket.io')(http); // Create a socketio instance on the web
    // server, for real time updates


const title = 'PAVEcraft Chat'; // Name of site, displayed in top left
const logPath = '/home/minecraft/server/logs/latest.log'; // Location of server log
// const logPath = 'testlog.log'; // Location of server log
const initialLines = 20; // Initial amount of lines to send to client

let tail;
// Function spawnTail() - spawns the tail process
// Returns
// tail process
const spawnTail = () => {
    // Create a following tail instance on the log file, returning no new lines.
    tail = spawn('/usr/bin/tail', ['-n0', '-f', logPath]);    // Create a readline on the tail instance
    const tailReader = readline.createInterface({input: tail.stdout});
    // Broadcast new chat lines to everyone on the io instance
    tailReader.on('line', (line) => {
        if(line.match(regex)) {
            console.log('Broadcasting new chat line ', line);
            io.emit('chat', formatLogLine(line))
        };
    });
    // If the tail fails, respawn tail after timeout
    tailReader.on('close', () => setTimeout(spawnTail, 1000));
};
// Spawn tail
spawnTail();

// Function getLastChat(n) - gets the last n lines from log
// Params
// n: amount of lines to gather
// Returns
// Promise which resolves to an array of lines once they're read from the file
const getLastChat = (n) => new Promise((resolve) => {
    let lines = [];

    // Create a new readline on the server log
    let lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(logPath)
    });

    lineReader.on('line', (line) => {
        if(line.match(regex)) lines.push(formatLogLine(line)); // Push the line 
            // to the array if it matches the regex
    });
    // At the end of the file, return the last n lines
    lineReader.on('close', () => resolve(lines.slice(-n)));
});

// Function formatLogLine(logLine) - formats a raw log line into an array,
//   first element being the timestamp, second being the chat line
// Params
// logLine: the raw log line to format
// Returns
// Array [timestamp, chat line]
const formatLogLine = (logLine) => [escape(logLine.split(' ')[0]), 
    escape(logLine.split(' [Server thread/INFO]: ')[1])];

// Set express' rendering engine to pug (pug is the language the app's pages 
// will be written in)
app.set('view engine', 'pug');

// Serve static files from the 'public' directory
app.use(express.static(__dirname + '/public'));

// Set up index route
app.get('/', (req, res) => {
    // Get the last 20 lines from the log
    getLastChat(20).then((lines) => {
        // Render the last 20 lines
        res.render('index', {lines, title});
    });
});

// Begin the app listening, and bind it to localhost
// It is considered good practice to never directly expose your app servers
// to the world, but rather use a reverse proxy like nginx or HAproxy.
http.listen(port, '127.0.0.1', () => {
    console.log('listening on ' + port + '...');
});
