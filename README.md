# Node WS + Redis for Scalability

Project inspired from Hussein Nasser video: https://www.youtube.com/watch?v=gzIcGhJC8hA


## How to Run?

Check the sample .env.sample file and create a `.env` file with correct values and then `nvm use && node .`


## WS Client Code

1. Setup the multiple ws client on your browser(s)
```
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
```
2. To publish chat message use the below code

```
wsClient.send(JSON.stringify({type:'__chat__', message: 'testing from client 1'}));
```

3. All your client(s) will receive the message with the senderId in the browser's console.


## Todo

[-] Refactor

[-] Tests

[-] Docker files to demo the scalability in real environment


