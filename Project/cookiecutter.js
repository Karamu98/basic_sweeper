const { ipcRenderer, dialog, BrowserWindow } = require('electron');

const saveCookiesBtn = document.getElementById("saveCookiesBtn");



saveCookiesBtn.addEventListener('click', (event) =>
{
    saveCookiesBtn.style.display = 'none';
    ipcRenderer.send('save-cookies');
})

ipcRenderer.on('enable', () => 
{
    saveCookiesBtn.style.display = 'block';
})