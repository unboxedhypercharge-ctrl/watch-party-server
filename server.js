const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let roomState = { time: 0, isPlaying: false, speed: 1, subtitle: null };

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

  socket.on('change_speed', (newSpeed) => {
    roomState.speed = newSpeed;
    io.emit('sync_speed', newSpeed);
  });

  socket.on('heartbeat_time', (currentTime) => {
    if (currentTime > roomState.time) {
      roomState.time = currentTime;
    }
  });

  socket.on('upload_subtitle', (vttText) => {
    roomState.subtitle = vttText; 
    io.emit('sync_subtitle', vttText); 
  });

  socket.on('i_am_buffering', () => { io.emit('force_wait'); });
  socket.on('buffer_resolved', () => { io.emit('clear_wait'); });
  socket.on('disconnect', () => { console.log('A friend disconnected.'); });
});

const listener = http.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port ' + listener.address().port);
});
