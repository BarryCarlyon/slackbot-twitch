var Slack = require('slack-client');
var http = require('https');
 
var token = '';

var streamers = ['']
// metatdata - Stream State
var metadata = {}
var channels = {}

var slack = new Slack(token, true, true);
 
slack.on('open', function () {

    channels = Object.keys(slack.channels)
        .map(function (k) { return slack.channels[k]; })
        .filter(function (c) { return c.is_member; })
        .map(function (c) { return c.name; });
 
    var groups = Object.keys(slack.groups)
        .map(function (k) { return slack.groups[k]; })
        .filter(function (g) { return g.is_open && !g.is_archived; })
        .map(function (g) { return g.name; });
 
    console.log('Welcome to Slack. You are ' + slack.self.name + ' of ' + slack.team.name);
 
    if (channels.length > 0) {
        console.log('You are in: ' + channels.join(', '));
    }
    else {
        console.log('You are not in any channels.');
    }
 
    if (groups.length > 0) {
       console.log('As well as: ' + groups.join(', '));
    }


//    channel_general = slack.getChannelByName("general")
//    channel_general.send("Hey! I've just started again. There may be missing twitch notifications.")

});

//Get current state of streams
streamer_poll("bacon_donut")

init()
slack.login();

function init() {
    streamers.forEach(function(item) {
        metadata[item] = {}
    })
    setInterval(streamer_statuspoll, 10000);
}

function streamer_statuspoll() {
    streamers.forEach(function(item) {
        streamer_poll(item)
    })
}

function sendslackmessage (room, message) {
    if (slack.connected) {
        if (channels.indexOf(room) > 0) {
            console.log ("#" + room)
            sChannel = slack.getChannelByName(room)
            sChannel.send(message)
        } else {
            sChannel = slack.getChannelByName("apidev") 
            sChannel.send("I need to be invited to: " + room)
        }
    }
}

function streamer_poll(channel) {
    var url = 'https://api.twitch.tv/kraken/streams/' + channel;

    http.get(url, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            var fbResponse = JSON.parse(body)
            if (fbResponse.stream == null) {
                metadata[channel]["state"] = false
                console.log (channel + " Streamer offline")
                sendslackmessage(channel, "Streamer offline")
            } else {
                metadata[channel]["state"] = true
                console.log (channel + " Streamer online")
                sendslackmessage(channel, "Streamer Online")
            }
        });
    }).on('error', function(e) {
        console.log("Got error: ", e);
    });
}
