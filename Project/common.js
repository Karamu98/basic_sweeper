const { spawn } = require('child_process');

module.exports =
{
    CMDRun: run,
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