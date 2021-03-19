'use strict';
module.exports = (wsClients, redisPublisher) => ({
  handleWSMessages: (message, wsClient) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.log(error);
      console.log('Error handling ws message - ', message);
    }

    if (parsedMessage) {
      switch (parsedMessage.type) {
        case '__pong__': {
          console.log('Pong received from client - ' + wsClient.clientId);
          const client = wsClients.get(wsClient.clientId);
          client.isAlive = true;
          client.lastConnected = +new Date();
          break;
        }
        case '__chat__': {
          redisPublisher.publish(
            'chat_message',
            JSON.stringify({
              message: parsedMessage.message,
              senderId: wsClient.clientId,
            })
          );
          break;
        }
        default:
          console.error('Unable to handle incoming message ', message);
      }
    }
  },

  handleRedisMessages: (channel, message) => {
    if (channel === 'chat_message') {
      let parsedMessage = {};
      try {
        parsedMessage = JSON.parse(message);
      } catch (error) {
        console.log(error);
        console.log('Error parsing redis message - ', message);
      }

      if (parsedMessage) {
        wsClients.forEach((client) => {
          if (client.clientId !== parsedMessage.senderId) {
            client.send(
              JSON.stringify({
                type: '__chat_response__',
                message: parsedMessage.message,
                senderId: parsedMessage.senderId,
              })
            );
          }
        });
      }
    }
  },
});
