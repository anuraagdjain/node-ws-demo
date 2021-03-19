require('dotenv').config();

const http = require('http');
const express = require('express');
const Websocket = require('ws');
const redis = require('redis');
const { v4: uuidV4 } = require('uuid');
const MessageHandler = require('./MessageHandler');

const PORT = process.env.APP_PORT;

const redisSubscriber = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });
const redisPublisher = redisSubscriber.duplicate();

const app = express();
const httpServer = http.createServer(app);
const wssServer = new Websocket.Server({ server: httpServer });

const wsClients = new Map();
const messageHandler = MessageHandler(wsClients, redisPublisher);

wssServer.on('connection', (wsClient) => {
  wsClient.isAlive = true;
  wsClient.lastConnected = +new Date();
  wsClient.clientId = uuidV4();
  wsClients.set(wsClient.clientId, wsClient);

  wsClient.on('message', (message) => messageHandler.handleWSMessages(message, wsClient));
});

redisSubscriber.on('message', messageHandler.handleRedisMessages);
redisSubscriber.subscribe('chat_message');

// TODO:
wssServer.on('close', (msg) => console.log('close:', err));
wssServer.on('error', (msg) => console.log('error: ', msg));

/* Perform heartbeat with clients*/
const heartbeat = () => {
  wsClients.forEach((wsClient) => {
    const timeElapsed = parseInt((+new Date() - wsClient.lastConnected) / 1000);
    const DISCONNECT_IN_SECONDS = 10;

    if (!wsClient.isAlive && timeElapsed > DISCONNECT_IN_SECONDS) {
      console.log('Terminating client due to inactivity - ' + wsClient.clientId);
      wsClients.delete(wsClient.clientId);
      return wsClient.terminate();
    }

    wsClient.isAlive = false;
    wsClient.send(JSON.stringify({ type: '__ping__' }));
    console.log('Ping sent to client - ' + wsClient.clientId);
  });
};

setInterval(heartbeat, 10000);

app.get('/', (req, res) => res.send('OK'));

httpServer.listen(PORT, process.env.APP_SERVER, () => {
  console.log('App running on ' + PORT);
});

/**
 * 
 * 
 * Chrome client code
  
let wsClient = new WebSocket(`ws://localhost:5000`);
wsClient.onmessage = function(message){
    let msg = JSON.parse(message.data);
    
    if(msg && Object.hasOwnProperty.call(msg,'type') && msg.type === '__ping__'){
        console.log('received ping from server');
        wsClient.send(JSON.stringify({type: '__pong__'}));
        return;
    }
    console.log(message);
};
 * 
 */
