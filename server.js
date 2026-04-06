const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const rooms = {}; 

app.get('/', (req, res) => { res.send('Watch Party Server is Awake!'); });

io.on('connection', (socket) => {
  console.log('A user connected!');

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId; 
    if (!rooms[roomId]) {
      rooms[roomId] = { time: 0, isPlaying: false, speed: 1, subtitle: null, users: 0 };
    }
    rooms[roomId].users++;
  });

  socket.on('request_catch_up', () => {
    if (socket.roomId && rooms[socket.roomId]) {
      socket.emit('catch_up', rooms[socket.roomId]);
    }
  });

  socket.on('play_video', (currentTime) => {
    if (!socket.roomId) return;
    rooms[socket.roomId].time = currentTime;
    rooms[socket.roomId].isPlaying = true;
    io.to(socket.roomId).emit('sync_play', currentTime);
  });

  socket.on('pause_video', (currentTime) => {
    if (!socket.roomId) return;
    rooms[socket.roomId].time = currentTime;
    rooms[socket.roomId].isPlaying = false;
    io.to(socket.roomId).emit('sync_pause', currentTime);
  });

  socket.on('seek_video', (currentTime) => {
    if (!socket.roomId) return;
    rooms[socket.roomId].time = currentTime;
    io.to(socket.roomId).emit('sync_seek', currentTime);
  });

  socket.on('change_speed', (newSpeed) => {
    if (!socket.roomId) return;
    rooms[socket.roomId].speed = newSpeed;
    io.to(socket.roomId).emit('sync_speed', newSpeed);
  });

  socket.on('heartbeat_time', (currentTime) => {
    if (!socket.roomId) return;
    
    if (currentTime > rooms[socket.roomId].time) {
      rooms[socket.roomId].time = currentTime;
      
      socket.broadcast.to(socket.roomId).emit('host_time', currentTime);
    }
  });

  socket.on('upload_subtitle', (vttText) => {
    if (!socket.roomId) return;
    rooms[socket.roomId].subtitle = vttText; 
    io.to(socket.roomId).emit('sync_subtitle', vttText); 
  });

  socket.on('i_am_buffering', () => { 
    if (socket.roomId) io.to(socket.roomId).emit('force_wait'); 
  });
  
  socket.on('buffer_resolved', () => { 
    if (socket.roomId) io.to(socket.roomId).emit('clear_wait'); 
  });

  socket.on('disconnect', () => {
    if (socket.roomId && rooms[socket.roomId]) {
      rooms[socket.roomId].users--;
      if (rooms[socket.roomId].users <= 0) {
        delete rooms[socket.roomId];
      }
    }
  });
});

const listener = http.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port ' + listener.address().port);
});
