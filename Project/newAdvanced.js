const { ipcRenderer } = require('electron');

const confirmBtn = document.getElementById('launchSessionButton');
const openBrowserBtm = document.getElementById('openBrowser');


confirmBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send("advanced-confirm");
})

openBrowserBtm.addEventListener('click', (event) =>
{
    
})