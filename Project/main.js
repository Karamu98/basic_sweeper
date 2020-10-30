const requester = require('request');
const open = require('open');
const { argv } = require('process');

var websiteURL = "https://www.youtube.co.uk";//"https://www.currys.co.uk/gbuk/playstation-5-sony-1714-commercial.html";
var tellSign = "<div class=\"sold-out-banner\">"
var pingTimeMilliseconds = 10000.0;

// Delta timer
var curPingTimer = 0.0;
var lastUpdate = Date.now();

var currentlyPinging;

function makeRequest()
{
    // Initalise here
    currentlyPinging = false;
    lastUpdate = Date.now();

    // Timer loop
    while(!currentlyPinging)
    {
        var now = Date.now();
        var delta = now - lastUpdate;
        lastUpdate = now;

        curPingTimer = curPingTimer - delta;

        if(curPingTimer <= 0.0)
        {
            currentlyPinging = true;
            console.log("Requesting site...");
            requester(websiteURL, processPage);
        }
    }
}

function processPage(error, responce, body)
{
    console.log("Response received.");

    if(error)
    {
       console.log(`Request error: ${error}`);
       return; 
    }

    if(responce.statusCode != 200)
    {
        console.log(`Bad response: ${responce.statusCode} - ${responce.statusMessage}`);
    }
    else
    {
        if(!body.includes(tellSign))
        {
            console.log("Availble!");
            // Open chrome with url
            open(websiteURL);
            return;
        }
        else
        {
            console.log("Not Available :(");
        }
    }

    curPingTimer = pingTimeMilliseconds;
    makeRequest();
}

function main()
{
    // Grab arguments
    var args = process.argv.slice(2);

    if(args != null && args.length > 0)
    {
        websiteURL = args[0];
        tellSign = args[1];
        pingTimeMilliseconds = Number(args[2]);
    }

    // Start core loop
    makeRequest();
}


main();
