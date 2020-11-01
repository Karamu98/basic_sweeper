const requester = require('@apify/http-request');
const open = require('open');
const process = require('process');
const { spawn } = require('child_process');
const { argv } = process;
const electron = require('electron');
const {app, BrowserWindow, ipcMain} = electron;
const path = require('path');

var websiteURL = "";
var tellSign = ""
var pingTimeMilliseconds = 10000.0;

// Delta timer
var curPingTimer = 0.0;
var lastUpdate = Date.now();

var currentlyPinging;

var usingGUI = false;
var mainWindow;
var processes = [];


async function makeRequest()
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

            try
            {
                const { body, statusCode} = await requester({url: websiteURL}).catch(err => {console.log(err);})
                processPage(statusCode, body);
            }
            catch
            {
                console.log("Request error.");
            }
        }
    }
}

function processPage(responce, body)
{
    console.log("Response received.");

    if(responce != 200)
    {
        console.log(`Bad response: ${responce}`);
    }
    else
    {
        if(!body.includes(tellSign))
        {
            console.log(body);
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
        pingTimeMilliseconds = Number(args[2]) * 1000;
    }
    else
    {
        app.whenReady().then(()=>
        {
            usingGUI = true;
            mainWindow = new BrowserWindow(
            {
                width: 680,
                height: 400,
                webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: true
                }
            })

            mainWindow.setMenu(null);

            // Load the index.html of the app.
            mainWindow.loadFile('index.html');

            app.on('window-all-closed', () => 
            {
                console.log("Quitting...");
                shutdown();
            })

            ipcMain.on('session:new-process', (e, sessionPID) => 
            {
                console.log("Adding new process...");
                processes.push(sessionPID);
            })

            ipcMain.on('clear-processes', () =>
            {
                console.log("Clearing processes...");
                clearProcesses();
            })
        });

        return 0;
    }

    // Start core loop
    makeRequest();
}

function clearProcesses()
{
    console.log(`Killing ${processes.length} processes`);
    processes.forEach(element => 
    {
        run("taskkill", ["/PID", element, "/F"], (code, command)=>{console.log(command)});
    });

    processes = [];
}

function shutdown()
{
    clearProcesses();
    app.quit();
    process.exit(0);
}

function run(command, option, done)
{
    console.log(" \nexecuting command " + command + " args: " + option +  "\n");

    const launch = spawn(command, option);
    let commandOutput = "";

    launch.stdout.on('data', (data) => {
        console.log(`${data}`);
        commandOutput += data;
        });

    launch.stderr.on('error', (data) => {
        console.error(`${data}`);
    });
    
    launch.on('close', (code) => {
        console.log(`Exited with code ${code}`);
        done(code, commandOutput);
    });

    return launch;
}


main();
