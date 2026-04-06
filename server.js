const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let roomState = {
  time: 0,
  isPlaying: false
};

app.get('/', (req, res) => { res.send('Watch Party Server is Awake!'); });

io.on('connection', (socket) => {
  console.log('A friend connected!');

socket.on('request_catch_up', () => {
  socket.emit('catch_up', roomState);
});
  socket.on('play_video', (currentTime) => {
    roomState.time = currentTime;
    roomState.isPlaying = true;
    io.emit('sync_play', currentTime); 
  });

  socket.on('pause_video', (currentTime) => {
    roomState.time = currentTime;
    roomState.isPlaying = false;
    io.emit('sync_pause', currentTime);
  });

  socket.on('seek_video', (currentTime) => {
    roomState.time = currentTime;
    io.emit('sync_seek', currentTime);
  });

  socket.on('i_am_buffering', () => {
    socket.broadcast.emit('force_wait');
  });
  socket.on('buffer_resolved', () => {
    socket.broadcast.emit('clear_wait');
  });
  socket.on('disconnect', () => { console.log('A friend disconnected.'); });
});

const listener = http.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port ' + listener.address().port);
});
