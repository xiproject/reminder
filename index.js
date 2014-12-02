var xal = require('../../xal-javascript');
var _ = require('underscore');
var sugar = require('sugar');
var wit = require('./wit');
var config = require('./config.json');


var possibleReminders = [];
var inputManager;

function processInputText(inputText, cb) {
    wit.parse(inputText, function(response) {
        if (response.intent === 'reminder' && response.confidence > 0.5) {
            cb({
                task: response.entities.reminder.value,
                time: Date.create(response.entities.datetime.value)
            });
        } 
        else{
            //Fallback to regular expressions
            var match = inputText.match(/\bremind me to\b(.*)/i);
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
    });
}

function createReminder(reminder) {
    // TODO: create calendar event
    // xal.createEvent('xi.event.calendar', function(state, done) {
    //     state.put('xi.event.calendar.start', reminder.time.toString());
    //     state.put('xi.event.calendar.end', reminder.time.toString());
    //     state.put('xi.event.calendar.title', 'Reminder');
    //     state.put('xi.event.calendar.description', reminder.task);
    //     done(state);
    // });

    setTimeout(function() {
        xal.log.info('trying to send reminder to output');
        xal.createEvent('xi.event.output.text', function(state, done) {
            xal.log.info({state: state}, 'created event');
            state.put('xi.event.output.text', 'You have to ' + reminder.task + ' now.');
            done(state);
        });
    }, reminder.time.getTime() - (new Date().getTime()));
}

function getReminder(eventId) {
    for (var i = 0; i < possibleReminders.length; ++i) {
        if (possibleReminders[i].eventId === eventId) {
            return possibleReminders[i];
        }
    }
    return null;
}

xal.on('xi.event.input.text', function(state, next) {
    var texts = state.get('xi.event.input.text');
    var text = _.reduce(texts, function(memo, value) {
        if (memo.certainty > value.certainty) {
            memo = value;
        }
        return memo;
    });
    processInputText(text.value, function(reminder){

        if (reminder) {
            xal.log.info({reminder: reminder}, 'Parsed a reminder out of input text');
            possibleReminders.push({
                eventId: state.get('xi.event.id'),
                reminder: reminder
            });
            state.put('xi.event.input.destination', xal.getId());
        }
        next(state);


    });
});

xal.on('xi.event.input.destination', function(state, next) {
    var dest = _.reduce(state.get('xi.event.input.destination'), function(memo, dest) {
        if (dest.source === inputManager.id) {
            memo = dest;
        }
        return memo;
    }, null);
    if (dest && dest.value == xal.getId()) {
        xal.log.info({dest: dest}, 'Acting on InputManager\'s command');
        var reminder = getReminder(state.get('xi.event.id'));
        if (reminder) {
            createReminder(reminder.reminder);
            xal.log.info({reminder: reminder.reminder}, 'Created reminder');
        } else {
            xal.log.info('Could not retrieve any reminder for this event');
        }
    }
    next(state);
});

xal.start({name: 'Reminder'}, function() {
    xal.getAgent({name: 'InputManager'}, function(err, agent) {
        if (err) {
            xal.log.fatal(err);
        } else if (agent === null) {
            xal.log.fatal('InputManager is required');
        } else {
            inputManager = agent;
        }
    });
});
