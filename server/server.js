const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const storage = require('./storage');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

//---serv the frontend

const path = require('path');

// After your other app.use() and routes
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});
//----------


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-canvas', ({ canvasId, userId }) => {
    console.log(`User ${userId} joined canvas ${canvasId}`);

    socket.join(canvasId);

    socket.userId = userId;
    socket.canvasId = canvasId;

    storage.addUserToCanvas(canvasId, userId);

    // Send previous drawings of this canvas to the new user
    const previousDrawings = storage.getDrawingsByCanvas(canvasId);
    previousDrawings.forEach((line) => socket.emit('drawing', line));

    // Notify all users in this canvas room about updated active users in that canvas
    const canvasUsers = storage.getUsersByCanvas(canvasId);
    io.to(canvasId).emit('users-update', canvasUsers);
  });

  socket.on('drawing', (data) => {
    // Save drawing to storage by canvasId
    storage.addDrawingToCanvas(data.canvasId, data);

    // Broadcast drawing to everyone in that canvas except sender
    socket.to(data.canvasId).emit('drawing', data);
  });

  socket.on('start-drawing', ({ userId, canvasId }) => {
    socket.to(canvasId).emit('user-drawing', { userId, isDrawing: true });
  });

  socket.on('stop-drawing', ({ userId, canvasId }) => {
    socket.to(canvasId).emit('user-drawing', { userId, isDrawing: false });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id} userId: ${socket.userId} canvasId: ${socket.canvasId}`);

    if (socket.userId && socket.canvasId) {
      storage.removeUserFromCanvas(socket.canvasId, socket.userId);

      // Notify remaining users in the canvas room about active users update
      const canvasUsers = storage.getUsersByCanvas(socket.canvasId);
      io.to(socket.canvasId).emit('users-update', canvasUsers);
    }
  });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
