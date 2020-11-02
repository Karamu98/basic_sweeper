const requester = require('@apify/http-request');
const open = require('open');
const process = require('process');
const { spawn } = require('child_process');
const electron = require('electron');
const {app, BrowserWindow, ipcMain} = electron;
const puppeteer = require('puppeteer');
const { ipcRenderer } = require('electron');
const common = require('./common');
const chromium = require('chromium');

// Data
var websiteURL = "";
var tellSign = ""
var pingTimeMilliseconds = 10000.0;

// Delta timer
var curPingTimer = 0.0;
var lastUpdate = Date.now();
var currentlyPinging;

// For using GUI and multiple instances
var usingGUI = false;
var mainWindow = null;
var advWindow = null;
var processes = [];

// For headless/basic
var usingChromium = false;
var usingHeadless = false;
var pupBrowser = null;
var pupPage = null;


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

            if(usingChromium)
            {
                await advancedProcess();
            }
            else
            {
                await basicProcess();
            }
        }
    }
}

async function basicProcess()
{
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

async function advancedProcess()
{
    try
    {
        await pupPage.goto(websiteURL);
        const bodyHandle = await pupPage.$('body');
        const html = await pupPage.evaluate(body => body.innerHTML, bodyHandle);
        await bodyHandle.dispose();
        processPage(200, html);
    }
    catch
    {
        console.log("Advanced process error.");
    }
}

function processPage(responceCode, body)
{
    console.log("Response received.");

    if(responceCode != 200)
    {
        console.log(`Bad response: ${responceCode}`);
    }
    else
    {
        if(!body.includes(tellSign))
        {
            console.log("Availble!");

            if(usingChromium && !usingHeadless)
            {
            }
            else
            {
                // Open chrome with url
                open(websiteURL);
                process.exit(0);
            }
        }
        else
        {
            console.log("Not Available :(");
        }
    }

    curPingTimer = pingTimeMilliseconds;
    makeRequest();
}

async function main()
{
    // Grab arguments
    var args = process.argv.slice(2);

    if(args != null && args.length > 0)
    {
        try
        {
            websiteURL = args[0];
            tellSign = args[1];
            pingTimeMilliseconds = Number(args[2]) * 1000;
            
            if(args.length >= 3 && args[3] == "-a")
            {
                usingChromium = true;

                if(args.length >= 4 && args[4] == "-h")
                {
                    usingHeadless = true;
                }

                console.log("Creating browser");
                pupBrowser = await puppeteer.launch({headless: usingHeadless});
                pupPage = await pupBrowser.newPage();
                console.log("Created page");


                process.on('exit', (code) =>
                {
                    if(pupBrowser != null)
                    {
                        pupBrowser.close();
                    }
                })
            }
        }
        catch(err)
        {
            console.log(err);
            console.log("Failed to parse arguments.");
            process.exit(1);
        }
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

            //mainWindow.setMenu(null);       
            
            mainWindow.on('close', (event) =>
            {
                console.log("Quitting...");
                shutdown();
            })

            // Load the index.html of the app.
            mainWindow.loadFile('index.html');

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

            ipcMain.on('new-advanced', () => 
            {
                if(advWindow != null && !advWindow.isDestroyed())
                {
                    console.log("Advanced window already open.");
                    return;
                }
                advWindow = new BrowserWindow(
                {
                    width: 680,
                    height: 400,
                    webPreferences: {
                        nodeIntegration: true,
                        enableRemoteModule: true
                    }
                })

                advWindow.setMenu(null);

                advWindow.loadFile('newAdvanced.html');
            })

            ipcMain.on('advanced-confirm', () =>
            {

            })
        });

        return;
    }

    // Start core loop
    makeRequest();
}

function clearProcesses()
{
    console.log(`Killing ${processes.length} processes`);
    processes.forEach(element => 
    {
        common.CMDRun("taskkill", ["/PID", element, "/F"], (code, command)=>{console.log(command)});
    });

    processes = [];
}

function shutdown()
{
    clearProcesses();
    app.quit();
    process.exit(0);
}


main();
