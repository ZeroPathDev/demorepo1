const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// RCE
wss.on('connection', ws => {
  ws.on('message', msg => {
    eval(msg);
    ws.send('Executed: ' + msg);
  });
});

console.log('WS vuln on port 8080');