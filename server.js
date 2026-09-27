const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

app.use(express.static('public'));
app.get('/*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

const roomsPassword = {};
io.on('connection', socket => {
  socket.on('join-room', ({roomId, password}) => {
    if(!roomsPassword[roomId]) roomsPassword[roomId] = password;
    if(roomsPassword[roomId] !== password) return socket.emit('wrong-password');
    
    socket.join(roomId);
    const users = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    socket.emit('all-users', users.filter(id => id !== socket.id));
    socket.to(roomId).emit('user-joined', socket.id);

    socket.on('signal', d => io.to(d.to).emit('signal', {from: socket.id, signal: d.signal}));
    socket.on('chat', d => io.to(roomId).emit('chat', d));
    socket.on('disconnect', () => socket.to(roomId).emit('user-left', socket.id));
  });
});
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('SILA Running on ' + PORT));
