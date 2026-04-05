const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" } 
});

app.get('/', (req, res) => {
  res.send('Watch Party Server is Awake!');
});

io.on('connection', (socket) => {
  console.log('A friend connected to the server!');

  socket.on('ping_event', () => {
    console.log('Someone clicked Ping!');
    socket.broadcast.emit('pong_event'); 
  });

  socket.on('disconnect', () => {
    console.log('A friend disconnected.');
  });
});

const listener = http.listen(process.env.PORT || 3000, () => {
  console.log('Server is listening on port ' + listener.address().port);
});
