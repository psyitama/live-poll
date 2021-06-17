const express = require('express');
const app = express();
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
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

//variables to keep of poll data
let question = '';
let choices = [];
let totalVoters = [];
let isReady = false; // if teacher is ready
let alreadyVote = false; // if the student is already voted
io.on('connection', function (socket) {
    //push socket id to count current total of voters
    totalVoters.push(socket.id);

    // init
    io.emit('question', question);
    io.emit('choices', choices);
    io.emit('voters', totalVoters.length - 1);
    io.emit('teacher-ready', isReady);
    io.emit('student-ready', isReady);

    // emit question
    socket.on('question', function (data) {
        question = data;
        io.emit('question', question);
    });

    // emit choices
    socket.on('choices', function (data) {
        choices = data;
        io.emit('choices', choices);
    });

    // emit votes
    socket.on('vote', function (data) {
        choices[data].vote = choices[data].vote + 1;
        let totalVotes = 0;
        for (let i = 0; i < choices.length; i++) {
            totalVotes += choices[i].vote;
        }
        io.emit('vote', totalVotes);
        io.emit('results', { choices, totalVotes });
    });

    // emit teacher if typing
    socket.on('typing', function (data) {
        socket.broadcast.emit('typing', data);
    });

    // emit teacher if they click ready
    socket.on('teacher-ready', function (data) {
        isReady = data;
        io.emit('teacher-ready', isReady);
    });

    // emit teacher they click stop
    socket.on('teacher-stop', function (data) {
        if (data == true) {
            alreadyVote = false;
            isReady = false;
            io.emit('teacher-ready', isReady);
            io.emit('student-ready', alreadyVote);
        }
    });

    // emit if the student already voted or ready
    socket.on('student-ready', function (data) {
        alreadyVote = data;
        socket.emit('student-ready', alreadyVote);
    });

    // subtract 1 for the total voters if they disconnect
    socket.on('disconnect', function () {
        totalVoters.pop();
        //  subtract 1 from the total voters because the teaher is not included
        io.emit('voters', totalVoters.length - 1);
    });
});
