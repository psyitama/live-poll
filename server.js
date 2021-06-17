const express = require('express');
const app = express();
app.use(express.static(__dirname + '/public'));
// This sets the location where express will look for the ejs views
app.set('views', __dirname + '/views');
// Now lets set the view engine itself so that express knows that we are using ejs as opposed to another templating engine like jade
app.set('view engine', 'ejs');
const server = app.listen(1337);
const io = require('socket.io')(server);

// routes
app.get('/', function (req, res) {
    res.render('index');
});
app.get('/aB33579', function (req, res) {
    res.render('student');
});

//variable to keep track and storage of the messages
let messages = [];
let question = '';
let choices = [];
let totalVoters = [];
let isReady = false;
io.on('connection', function (socket) {
    // Handle chat event
    totalVoters.push(socket.id);

    io.emit('question', question);
    io.emit('choices', choices);
    io.emit('voters', totalVoters.length - 1);
    socket.emit('ready', isReady);

    socket.on('question', function (data) {
        question = data;
        io.emit('question', question);
    });

    socket.on('choices', function (data) {
        choices = data;
        io.emit('choices', choices);
    });

    socket.on('vote', function (data) {
        choices[data].vote = choices[data].vote + 1;
        let totalVotes = 0;
        for (let i = 0; i < choices.length; i++) {
            totalVotes += choices[i].vote;
        }
        io.emit('vote', totalVotes);
        io.emit('results', { choices, totalVotes });
    });

    //typing
    socket.on('typing', function (data) {
        socket.broadcast.emit('typing', data);
    });

    //typing
    socket.on('teacher-ready', function (data) {
        isReady = data;
        socket.emit('ready', isReady);
    });

    // test
    socket.on('chat', function (data) {
        messages.push(data);
        io.socket.emit('chat', messages);
    });

    socket.on('disconnect', function () {
        totalVoters.pop();
        io.emit('voters', totalVoters.length - 1);
    });
});
