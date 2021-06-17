$(document).ready(function () {
    const socket = io();

    // reset data when teacher stop collecting responses and proceed for new question and choices
    $(window).on('load', function () {
        socket.emit('typing', '');
        initChoices();
    });

    // add choice
    $(document).on('click', '#add-choice', function (e) {
        const choice = `
            <li>
                <input type="text"/>
                <span class="delete">delete</span>
            </li>`;

        $('.choices ul').append(choice);
        initChoices();
    });

    //show delete choice button in mouseover
    $(document).on('mouseover', '.choices ul li', function (e) {
        $(this).children().last().show();
    });
    $(document).on('mouseout', '.choices ul li', function (e) {
        $(this).children().last().hide();
    });

    // delete choice
    $(document).on('click', '.delete', function (e) {
        $(this).parent('li').remove();
        initChoices();
    });

    // listen for keyup event for realtime emmit of choices
    $(document).on('keyup', 'input[type=text], textarea', function (e) {
        socket.emit('typing', 'Your teacher is typing...');
        initChoices();
    });

    // listen for click event for realtime emmit of choices
    $(document).on('click', '#collect-response', function (e) {
        $('textarea').hide();
        $('ul').hide();
        $('#add-choice').hide();
        $('#collect-response').hide();
        $('#stop-response').show();
        $('.results-teacher').show();

        socket.emit('teacher-ready', true);
        socket.emit('typing', '');

        initChoices();
    });

    //stop collecting response
    $(document).on('click', '#stop-response', function (e) {
        socket.emit('teacher-stop', true);
        if (
            !alert(
                `Your students can now see the last poll data.\n\n When you are done having your students see the last poll data, click on the button below to start over and create a new poll question.`
            )
        ) {
            location.reload(true);
        }
    });

    // student vote
    $(document).on('click', '#vote-btn', function (e) {
        socket.emit('student-ready', true);
        socket.emit('vote', $("input[name='radio']:checked").val());
    });

    // function to store choices and question and emmit it to the students
    function initChoices() {
        let currentChoices = [];

        $('input[type=text]').each(function (index) {
            currentChoices.push({
                vote: 0,
                choice: $(this).val()
            });
        });
        socket.emit('choices', currentChoices);
        socket.emit('question', $('textarea').val());
    }

    /***** SOCKET ON EVENTS *****/
    //  question event
    socket.on('question', function (data) {
        if (data == null) {
            data = '';
        }
        let question = `Question: ${data} <i class="fas fa-question"></i>`;
        $('.question').html(question);
    });

    //  choices event
    socket.on('choices', function (data) {
        let html = '';
        for (let i = 0; i < data.length; i++) {
            html += `
            <label class="container">${data[i].choice}
                <input type="radio" name="radio" value="${i}">
                <span class="checkmark"></span>
            </label>
            `;
        }
        $('.student-choices').html(html);
    });

    //total number of voters event
    socket.on('voters', function (data) {
        if (data != null) {
            $('.total-voters').html(data);
        }
    });

    //total number of who voted event
    socket.on('vote', function (data) {
        if (data != null) {
            $('.total-votes').html(data);
        }
    });

    //results event
    socket.on('results', function (data) {
        let results = '';
        for (let i = 0; i < data.choices.length; i++) {
            results += `
                <li>
                    ${data.choices[i].choice}
                    <b>
                        (${Math.floor(
                            (data.choices[i].vote / data.totalVotes) * 100
                        )}% 
                    </b>
                    - ${data.choices[i].vote} selected this )
                </li>
            `;
        }
        $('.results-teacher').html(results);
        $('.results-students').html(results);
    });

    //typing event
    socket.on('typing', function (data) {
        $('.typing').html(`<p><em>${data}</em></p>`);
    });

    // if teacher is ready event
    socket.on('teacher-ready', function (data) {
        if (data == true) {
            $('.notice').hide();
            $('#vote-btn').show();
        } else {
            $('.notice').show();
            $('#vote-btn').hide();
        }
    });

    // show the results on the students if the they click the vote submit button event
    socket.on('student-ready', function (data) {
        if (data == true) {
            $('#vote-btn').hide();
            $('.student-choices').hide();
            $('.results-students').show();
        } else {
            $('.student-choices').show();
            $('.results-students').hide();
        }
    });
});
