const requester = require('@apify/http-request');
const open = require('open');
const process = require('process');
const electron = require('electron');
const {app, BrowserWindow, ipcMain} = electron;
const puppeteer = require('puppeteer');
const common = require('./common');
const path = require('path');
const { Menu, dialog, ipcRenderer } = require('electron');
const fs = require('fs');
const url = require('url');

const command = "scraper-win.exe"

const isPkg = true;
const chromiumExePath =
(
    isPkg ? path.join(path.dirname(process.execPath), 'chromium\\win64-809590\\chrome-win\\chrome.exe') : puppeteer.executablePath()
)

const dialogOptions =
{
    title: 'Save cookies',
    defaultPath: process.execPath,
    filters: 
    [
        {
            name: ".kara",
            extensions: ["kara"]
        }
    ]
}

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
var processes = [];

// For headless/basic
var usingChromium = false;
var usingHeadless = false;
var pupBrowser = null;
var pupPage = null;

// For using cookie file
var cookieFilePath = null;
var pupCookieCutterBrowser = null;
var pupCookieCutterPage = null;
var cookieCutterWindow = null;
var cachedCookieFilePath = null;


const menuLayout = [
    {
        label: 'Menu',
        submenu:[
            {
                label: 'Open cookie cutter',
                click()
                {
                    openCookieCutter();
                }
            },
            {
                label: 'Toggle Debug',
                click()
                {
                    mainWindow.toggleDevTools();
                }
            },
            {
                label: 'Quit',
                click()
                {
                    shutdown();
                }
            }
        ]
    }
]


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

async function openCookieCutter()
{
    if(pupCookieCutterBrowser != null)
    {
        return;
    }

    let launchOptions = 
    {
        headless: false,
        executablePath: chromiumExePath
    }

    cookieCutterWindow = new BrowserWindow(
        {
            width: 680,
            height: 400,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true
            }
        })
    cookieCutterWindow.setMenu(null);
    cookieCutterWindow.loadURL(url.format(
        {
            pathname: path.join(__dirname, "cookiecutter.html"),
            protocol: 'file:',
            slashes: true
        }
    ));

    cookieCutterWindow.on("closed", (event) =>
    {
        pupCookieCutterBrowser.close();
        cookieCutterWindow = null;
    })

    ipcMain.on('save-cookies', (event) =>
    {
        var saveFile = dialog.showSaveDialogSync(mainWindow, dialogOptions);

        if(saveFile == undefined)
        {
            event.reply('enable');
            return;
        }
        
        saveCookies(saveFile);

        cookieCutterWindow.close();
    })

    pupCookieCutterBrowser = await puppeteer.launch(launchOptions);
    var pages = await pupCookieCutterBrowser.pages();
    pupCookieCutterPage = pages[0];

    pupCookieCutterBrowser.on("disconnected", (event) =>
    {
        if(cookieCutterWindow != null)
        {
            cookieCutterWindow.close();
        }
        pupCookieCutterBrowser = null;
    })
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

async function saveCookies(file)
{
    const cookies = await pupCookieCutterPage.cookies();

    fs.writeFileSync(file, JSON.stringify(cookies, null, 2));
}

function loadCookies(filePath)
{
    const cookiesData = fs.readFileSync(filePath);
    if(cookiesData == null)
    {
        return null;
    }
    else
    {
        return JSON.parse(cookiesData);
    }
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
            
            if(args.includes("-a"))
            {
                usingChromium = true;

                if(args.includes("-h"))
                {
                    usingHeadless = true;
                }

                var usingCookies = false;
                if(args.includes("-c"))
                {
                    var nextItem = args.indexOf("-c") + 1;
                    usingCookies = true;

                    try
                    {
                        cookieFilePath = args[nextItem];
                    }
                    catch(err)
                    {
                        console.log(err);
                        return;
                    }
                }

                console.log("Creating browser");

                let launchOptions = 
                {
                    headless: usingHeadless,
                    executablePath: chromiumExePath
                }

                pupBrowser = await puppeteer.launch(launchOptions);

                var pages = await pupBrowser.pages();
                pupPage = pages[0];

                if(usingCookies)
                {
                    console.log("Setting cookies.");
                    var cookies = loadCookies(cookieFilePath);
                    await pupPage.setCookie(...cookies);
                }

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



            const mainMenu = Menu.buildFromTemplate(menuLayout);

            mainWindow.setMenu(mainMenu);       
            
            mainWindow.on('close', (event) =>
            {
                console.log("Quitting...");
                shutdown();
            })

            // Load the index.html of the app.
            mainWindow.loadFile('index.html');

            ipcMain.on('clear-processes', () =>
            {
                console.log("Clearing processes...");
                clearProcesses();
            })

            ipcMain.on('load-cookies', (event) =>
            {
                console.log("Received call");
                var loadFile = dialog.showOpenDialogSync(mainWindow, dialogOptions);
        
                if(loadFile == undefined)
                {
                    event.reply('cache-data', null);
                    return;
                }

                var validFile = loadCookies(loadFile[0]);
                if(validFile != null)
                {
                    cachedCookieFilePath = loadFile[0];
                    event.reply('cache-data', loadFile[0]);
                }
                else
                {
                    event.reply('cache-data', null);
                    return;
                }
            })

            ipcMain.on('clear-cookies', (event) =>
            {
                cachedCookieFilePath = null;
                event.reply('cache-data', null);
            })

            ipcMain.on('session:new-process', (event, pid) =>
            {
                console.log("Adding new process...");
                processes.push(pid);
            })

            ipcMain.on('request-cookies-path', (event) =>
            {
                event.reply('cookie-path', cachedCookieFilePath);                
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
