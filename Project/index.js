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

const openFileDialogBtn = document.getElementById("loadCookiesBtn");
const clearCookiesBtn = document.getElementById("clearCacheBtn");
const headlessToggle = document.getElementById("runHeadless");
const headlessLabel = document.getElementById("headlessLabel");

openFileDialogBtn.style.display = 'none';
clearCookiesBtn.style.display = 'none';
headlessLabel.style.display = 'none';

newWindowBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send('request-cookies-path');
})

fakeBrowserToggle.addEventListener('click', (event) =>
{
    openFileDialogBtn.style.display = fakeBrowserToggle.checked ? 'block' : 'none';
    headlessLabel.style.display = fakeBrowserToggle.checked ? 'block' : 'none';
})

clearAllBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send('clear-processes');
})

clearCookiesBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send('clear-cookies');
})

openFileDialogBtn.addEventListener('click', (event) =>
{
    console.log("send!");
    ipcRenderer.send('load-cookies');
})

ipcRenderer.on('cache-data', (event, fileName) =>
{
    if(fileName == null)
    {
        clearCookiesBtn.style.display = 'none';
        return;
    }

    clearCookiesBtn.style.display = 'block';
    clearCookiesBtn.innerHTML = `Clear ${fileName}`;
})

ipcRenderer.on('cookie-path', (event, cookiePath) =>
{
    var urlVal = urlElement.value;
    var elementVal = elementElement.value;
    var timeoutVal = Number(timeoutElement.value);
    var useChromium = fakeBrowserToggle.checked;
    var isHeadless = headlessToggle.checked;

    var arguments = [urlVal, elementVal, timeoutVal];

    if(useChromium)
    {
        arguments.push("-a");
        if(isHeadless)
        {
            arguments.push("-h");
        }
    }

    if(cookiePath != null)
    {
        arguments.push('-c');
        arguments.push(cookiePath);
    }

    var session = common.CMDRun(command, arguments, (code, command)=>{console.log(command)});

    urlElement.value = "";
    elementElement.value = "";
    timeoutElement.value = 5;
    
    addListItem(urlVal, elementVal, timeoutVal, session);
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