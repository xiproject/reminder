var request = require('request').defaults({
    proxy: 'http://10.3.100.207:8080'
});

var token = require('./config.json').wit;

var message = 'Remind me to slap vikrant in 4 minutes';




function parseEntity(obj) {
    var output = {}
    
    output.start = obj['start'];
    output.end = obj['end'];
    output.value = obj['value'];
    output.body = obj['body'];
    return output
};

function parseResult(obj) {
    var outcome = obj['outcomes'][0];
    var output = {};
    output.raw = obj;
    output.text = obj['_text'];
    output.intent = outcome['intent'];
    output.confidence = outcome['confidence'];
    output.entities = {};
    for (var name in outcome['entities']) {
        output.entities[name] = parseEntity(outcome['entities'][name][0]);
    }
    return output;
};

//Does not support parsing time intervals
function parse(input, cb){
    var options = {
        uri: 'https://api.wit.ai/message?q='+ encodeURIComponent(input),
        headers: {
            'Authorization': 'Bearer ' + token
        },
    };

    request(options, function(error, response, body) {

        console.log(body);
        cb(parseResult(JSON.parse(body)));
    });
}

exports.parse = parse;
