const { ipcRenderer } = require('electron');
const common = require('./common');

const command = "scraper-win.exe"
const newWindowBtn = document.getElementById("launchSessionButton");
const clearAllBtn = document.getElementById("clearAllButton");
const sessionList = document.getElementById("sessionList");
const fakeBrowserToggle = document.getElementById('fakeBrowser');

const urlElement = document.getElementById("URL");
const elementElement = document.getElementById("element");
const timeoutElement = document.getElementById("timeout");

newWindowBtn.addEventListener('click', (event) =>
{
    var urlVal = urlElement.value;
    var elementVal = elementElement.value;
    var timeoutVal = Number(timeoutElement.value);
    var headlessVal = fakeBrowserToggle.checked;

    var arguments = [urlVal, elementVal, timeoutVal * 1000];

    if(headlessVal)
    {
        arguments.push("-a");
        arguments.push("-h");
    }

    var session = common.CMDRun(command, arguments, (code, command)=>{console.log(command)});

    urlElement.value = "";
    elementElement.value = "";
    timeoutElement.value = 5;
    
    addListItem(urlVal, elementVal, timeoutVal, session);
})

clearAllBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send('clear-processes');
})

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
        console.log('Removing list element.');
        sessionList.removeChild(li);
    });

    ipcRenderer.send('session:new-process', session.pid);
}