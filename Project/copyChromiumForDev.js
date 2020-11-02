const fs = require('fs-extra');

const chromiumDir = "./node_modules/puppeteer/.local-chromium/";
const dest = "./chromium";


function copy()
{
    try
    {
        fs.copySync(chromiumDir, dest, {overwrite: true});
    }
    catch(err)
    {
        console.log(err);
    }
}

copy();