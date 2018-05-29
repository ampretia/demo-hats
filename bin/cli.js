#!/usr/bin/env node


'use strict';

const fs = require('fs');

const path = require('path');

const debug = require('debug')('hats:server');
const util = require('../lib/util.js');

const http = require('http');
const puppeteer = require('puppeteer');
const boxen = require('boxen');

let args = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 [-c config.json]', 'Startsup Demo-hats')
    .alias('c', 'config')
    .nargs('c', 1)
    .describe('c', 'Configuration file - ./hats.json is the default')
    .help('h')
    .alias('h', 'help')
    .argv;

let filename = path.resolve('./hats.json');
if (args.c){
    filename = path.resolve(args.c);
}

let fullcfg;
if (fs.existsSync(filename)){
    fullcfg = JSON.parse(fs.readFileSync(filename));
} else {
    console.log(`Configuration file ${filename} not located.`);
    process.exit(1);
}
//todo rename
let cfg=fullcfg.personas;
let keys = Object.keys(cfg);
for (let k of keys){
    let setting = cfg[k];
    if (!setting.uri){
        throw new Error(`${k} should have a uri element`);
    }

    if (!setting.bio){
        setting.bio='';
    }

    if (!setting.avatar){
        setting.avatar = `${k}.png`;
    }

    if (!setting.displayName){
        setting.displayName = k;
    }

    if (!setting.startState){
        setting.startState = 'closed';
    } else {
        if (setting.startState !== 'open' && setting.startState !== 'closed' && setting.startState !== 'focus'){
            throw new Error(`${k} startState should be open, closed or focus.  Not present means closed`);
        }
    }
}


let app = require('../lib/app');


/**
 * Get port from environment and store in Express.
 */
let port = util.normalizePort(process.env.PORT || '3456');
app.set('port', port);

/**
 * Create HTTP server, and setup the socket.io connection
 */
let server = http.createServer(app);
let io = require('socket.io')(server);

io.on('connection', function(socket){
    debug('Ctrl page connected');

    let mapping={};
    keys.forEach(function(e){
        mapping[e] = cfg[e].displayName;
    });
    socket.emit('valid',mapping);

    socket.on('disconnect', function(){
        debug('Ctrl page disconnected');
    });

    socket.on('qr', function(msg){
        msg = msg.toLowerCase().trim();
        // check against the keys in the config and ignore if not there
        let qrAction = Object.keys(cfg).filter( (e)=>{
            return e===msg;
        });
        debug(`Using ${msg} ${qrAction}`);
        if (qrAction && cfg[qrAction]){
            cfg[qrAction].page.bringToFront();
        }
    });

});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        console.log(bind + ' requires elevated privileges');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.log(bind + ' is already in use');
        process.exit(1);
        break;
    default:
        throw error;
    }
}
);

// confirm the port we are listening on
server.on('listening', () =>{
    let addr = server.address();
    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : addr.port;

    let message = `Demo-hats control page available on http://localhost:${bind}/`;
    console.log(
        boxen(message, {
            padding: 1,
            borderColor: 'green',
            margin: 1
        })
    );


});


(async () => {
    app.set('cfg',cfg);
    app.set('info',fullcfg.info);

    try {
        const browser = await puppeteer.launch({headless:false,args: ['--disable-infobars']});
        let keys = Object.keys(cfg);
        for (let k of keys){
            let setting = cfg[k];
            setting.page = await browser.newPage();
            await setting.page.goto(setting.uri);
            await setting.page._client.send('Emulation.clearDeviceMetricsOverride');
        }
        let welcomePage = await browser.newPage();
        await welcomePage.goto('http://localhost:3456/welcome');
        await welcomePage._client.send('Emulation.clearDeviceMetricsOverride');
    } catch (error){
        console.log(error);
        process.exit(1);
    }

})();


