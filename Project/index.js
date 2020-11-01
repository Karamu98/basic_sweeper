const command = "scraper-win.exe"
const { spawn } = require('child_process');
const { ipcRenderer } = require('electron');

const newWindowBtn = document.getElementById("launchSessionButton");
const clearAllBtn = document.getElementById("clearAllButton");
const sessionList = document.getElementById("sessionList");

newWindowBtn.addEventListener('click', (event) =>
{
    var urlElement = document.getElementById("URL");
    var elementElement = document.getElementById("element");
    var timeoutElement = document.getElementById("timeout");

    var urlVal = urlElement.value;
    var elementVal = elementElement.value;
    var timeoutVal = Number(timeoutElement.value);

    var session = run(command, [urlVal, elementVal, timeoutVal * 1000], done);

    urlElement.value = ""
    elementElement.value = "";
    timeoutElement.value = 5;
    
    addListItem(urlVal, elementVal, timeoutVal, session);
})

clearAllBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send('clear-processes');
})

function done(code, commandOutput)
{
    console.log(`${code}\n${commandOutput}`);
}

function run(command, option, done)
{
    console.log("\nExecuting command " + command + " args: " + option +  "\n");

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

function addListItem(url, element, timeout, session)
{
    const li = document.createElement('tr');
    const itemText = document.createElement('td');
    const elementText = document.createElement('td');
    const timeoutText = document.createElement('td');

    itemText.innerHTML = url;
    elementText.innerHTML = element;
    timeoutText.innerHTML = timeout;

    li.appendChild(itemText);
    li.appendChild(elementText);
    li.appendChild(timeoutText);
    sessionList.appendChild(li);

    session.on('close', (code) => 
    {
        sessionList.removeChild(li);
    });

    ipcRenderer.send('session:new-process', session.pid);
}