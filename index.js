var xal = require('../../xal-javascript');
var _ = require('underscore');
var sugar = require('sugar');
var wit = require('./wit');
var config = require('./config.json');


var possibleReminders = [];

function processInputText(inputText, cb) {
    //Fallback to regular expressions
    var match = inputText.match(/.*\bremind me to\b(.*)/i);
    if (match) {
        var t = match[1].match(/(.*?)(( in)? (\d+ (second|minute|hour|day)s?).*)/i);
        if (t) {
            var time = Date.create(t[4] + ' from now');
            cb({
                task: t[1],
                time: time
            });
        }
    }
    else{
        cb(null);
    }
}

function createReminder(reminder) {
    // TODO: create calendar event
    setTimeout(function() {
        xal.log.info('trying to send reminder to output');
        xal.createEvent('xi.event.output.text', function(state, done) {
            xal.log.info({
                state: state
            }, 'created event');
            state.put('xi.event.output.text', 'You have to ' + reminder.task + ' now.');
            done(state);
        });
    }, reminder.time.getTime() - (new Date().getTime()));
}

xal.on('xi.event.input.text', function(state, next) {
    var texts = state.get('xi.event.input.text');
    var text = _.reduce(texts, function(memo, value) {
        if (memo.certainty > value.certainty) {
            memo = value;
        }
        return memo;
    });
    processInputText(text.value, function(reminder) {
        if (reminder) {
            xal.log.info({
                reminder: reminder
            }, 'Parsed a reminder out of input text');
            createReminder(reminder);
            state.put('xi.event.output.text', "Okay, I will remind you to " + reminder.reminder.task);
        }
        next(state);
    });
});

xal.start({
    name: 'Reminder'
});
