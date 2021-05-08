const childProcess = require('child_process');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs')
const low = require('lowdb');

let path = './bb/';
const serverfile = 'server.js';
const configfile = 'config.json';

try {
    if (!fs.existsSync(path + serverfile)) {
        path = './';
    }
} catch (err) {
    console.error(`Error occured while setting path to server.js: ` , err)
}

const adapter = new FileSync(path + configfile);
const dbConfig = low(adapter);
dbConfig.defaults({ bots: [] })
    .write();

const config = getConfiguration();

const arg = process.argv[2] || null;
const arg2 = process.argv[3] || null;
let newBot = false;
let newBotID = '001';

const lastBot = config.slice(-1)[0] ? config.slice(-1)[0].botID : null;

if (arg) {
    if (arg == 'new') {
        newBot = true;
        newBotID = lastBot ? (Number(lastBot) + 1).toString().padStart(3, '0') : '001'
    } else if (arg == 'start') {
        let match = config.find(b => b.botID == arg2);
        if (!match) {
            console.log(`Error: Invalid or missing botID ${arg2} | To start a bot use: node bb start [botID]`)
            return process.exit(1);
        } else {
            updateStatus(arg2, 'running');
            console.log('');
            console.log('---------------------------------------------');
            console.log(`Enabling botID ${arg2} | It will start up next time you run: node bb`)
            console.log('---------------------------------------------');
            console.log('');
            return process.exit(1);
        }
    } else if (arg == 'stop') {
        let match = config.find(b => b.botID == arg2);
        // console.log(match)
        if (!match) {
            console.log(`Error: Invalid or missing botID ${arg2} | To stop a bot use: node bb stop [botID]`)
            return process.exit(1);
        } else {
            updateStatus(arg2, 'stopped');
            console.log('');
            console.log('---------------------------------------------');
            console.log(`Disabling botID ${arg2} | It won't start up next time you run: node bb`)
            console.log('---------------------------------------------');
            console.log('');
            return process.exit(1);
        }
    }
    else {
        console.log(`Error: Invalid argument ${arg} | Supported arguments are: new, start [botID], stop [stopID]`)
        return process.exit(1);
    }
}

console.log('');
console.log('---------------------------------------------');
if (config.length != 0) {
    config.forEach((bot) => {
        if (bot.status == 'running') {
            console.log(`Starting bot | id: ${bot.botID} | name: ${bot.botname}`);
            startBot(serverfile, [bot.botID], { cwd: path }, function (err) {
                if (err) console.log(err);
            });
        } else if (bot.status == 'stopped') {
            console.log(`Idling bot   | id: ${bot.botID} | name: ${bot.botname}`);
        }
        if (bot.botID == newBotID) newBotID = null;
    });
}
if (config.length == 0 || newBot) {
    console.log(`Starting new bot | id: ${newBotID}`);
    startBot(serverfile, [newBotID], { cwd: path }, function (err) {
        if (err) console.log(err);
    });
}
console.log('---------------------------------------------');
console.log('');

function updateStatus(botID, status) {
    dbConfig.get('bots')
        .find({ botID: botID })
        .assign({ status: status})
        .write()
} 

function startBot(scriptPath, args, options, callback) {
    // Prevent multiple invocations
    let invoked = false;

    const process = childProcess.fork(scriptPath, args, options);

    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        callback(null);
    });
}

function getConfiguration() {
    return result = dbConfig.get('bots').value() || [];
}