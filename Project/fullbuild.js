const fs = require('fs-extra');

var buildName = "web-scraper-win32-ia32";

const finalBuildDest = `./../Build/${buildName}`;
const pkgDir = "./pkgBuild/";
const buildOutDir = `./release-builds/`;
const buildDir = `${buildOutDir}${buildName}/`;
const chromuimDestDir = `${buildDir}chromium/`;
const chromiumDir = "./node_modules/puppeteer/.local-chromium/";



function movePKGToBuild()
{
    try
    {
        var files = fs.readdirSync(pkgDir);

        if(files.length <= 0)
        {
            console.log('No pkg files to move.');
        }

        files.forEach(file =>
            {
                try 
                {
                    console.log(`Moving file: ${file}`);
                    fs.copySync(pkgDir + `/${file}`, buildDir + `/${file}`);
                } 
                catch (err) 
                {
                    console.log(`movePKGToBuild: ${err}`);
                    return;
                }
            })
    }
    catch(err)
    {
        console.log(`movePKGToBuild: ${err}`);
        return;
    }

    fs.rmdir(pkgDir, {recursive: true}, (err) =>
    {
        if(err)
        {
            throw err;
        }
    })

    moveChromiumToBuild();
}

function moveChromiumToBuild()
{
    try 
    {
        fs.copySync(chromiumDir, chromuimDestDir);
    } 
    catch (err) 
    {
        console.log(`moveChromiumToBuild: ${err}`);
        return;
    }

    console.log("Copied chromium.");

    copyBuildToFinalDest()
}

function copyBuildToFinalDest()
{
    try 
    {
        fs.moveSync(buildDir, finalBuildDest, {overwrite: true});
    } 
    catch (err) 
    {
        console.log(`copyBuildToFinalDest: ${err}`);
        return;
    }

    try
    {
        fs.rmdirSync(buildOutDir, {recursive: true});
    }
    catch(err)
    {

    }
}

movePKGToBuild();