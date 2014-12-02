var request;
var config;
var token;
var fs = require('fs');

if (fs.existSync('./config.json')) {
    config = require('./config.json');
    token = config.wit;
    if (config.proxy) {
        request = require('request').defaults({
            proxy: config.proxy
        });
    } else {
        request = require('request');
    }
}

function parseEntity(obj) {
    var output = {};
    output.start = obj.start;
    output.end = obj.end;
    output.value = obj.value;
    output.body = obj.body;
    return output;
}

function parseResult(obj) {
    var outcome = obj.outcomes[0];
    var output = {};
    output.raw = obj;
    output.text = obj._text;
    output.intent = outcome.intent;
    output.confidence = outcome.confidence;
    output.entities = {};
    for (var name in outcome.entities) {
        output.entities[name] = parseEntity(outcome.entities[name][0]);
    }
    return output;
}

//TODO Does not support parsing time intervals
function parse(input, cb) {
    if(!token){
        return;
    }
    var options = {
        uri: 'https://api.wit.ai/message?q=' + encodeURIComponent(input),
        headers: {
            'Authorization': 'Bearer ' + token
        },
    };

    request(options, function(error, response, body) {
        cb(parseResult(JSON.parse(body)));
    });
}

exports.parse = parse;
