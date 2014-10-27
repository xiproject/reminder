var xal = require('../../xal-javascript');
var _ = require('underscore');
var sugar = require('sugar');

var possibleReminders = [];

function processInputText(inputText) {
    var match = inputText.match(/\bremind me to\b(.*)/i);
    if (match) {
        var t = match[1].match(/(.*?)(( in)? (\d+ (second|minute|hour|day)s?).*)/i);
        if (t) {
            var time = Date.create(t[4] + ' from now');
            return {
                task: t[1],
                time: time
            };
        }
    }
    return null;
}

function createReminder(task, time) {
    xal.createEvent('xi.event.calendar', function(state, done) {
        state.put('xi.event.calendar.start', time);
        state.put('xi.event.calendar.end', time);
        state.put('xi.event.calendar.title', 'Reminder');
        state.put('xi.event.calendar.description', task);
        done(state);
    });
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
    xal.log.info({texts: texts}, 'Got texts');
    var text = _.reduce(texts, function(memo, value) {
        if (memo.certainty > value.certainty) {
            memo = value;
        }
        return memo;
    });
    var reminder = processInputText(text.value);
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

xal.on('xi.event.input.destination', function(state, next) {
    var dest = state.get('xi.event.input.destination');
    if (dest === xal.getId()) {
        xal.log.info('This is a scam because I set destination to myself');
        var reminder = getReminder(state.get('xi.event.id'));
        if (reminder) {
            createReminder(reminder.reminder);
            xal.log.info({reminder: reminder.reminder}, 'Created reminder');
        } else {
            xal.log.info('Could not retrieve any reminder for this event');
        }
    }
});

xal.start({name: 'Reminder'});
