import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", // Origin 1
      "https://screen-sharing-client.onrender.com", // Origin 2
    ],
    methods: ["GET", "POST"],
  },
});
const users = {};

const socketToRoom = {};

io.on("connection", (socket) => {
  const socketId = socket.id;
  socket.on("join room", (roomID, name) => {
    if (users[roomID]) {
      // const length = users[roomID].length;
      
      // if (length === 4) {
      //   socket.emit("room full");
      //   return;
      // }
      users[roomID].push({ id: socket.id, name });
    } else {
      users[roomID] = [{ id: socket.id, name }];
    }
    socketToRoom[socket.id] = { roomID };

    const usersInThisRoom = users[roomID]
      .filter((user) => user.id !== socket.id)
      .map((user) => ({ id: user.id, name: user.name }));
    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    const callerName = users[payload.roomID].find(
      (user) => user.id === payload.callerID
    )?.name;
    console.log("sending signal", callerName);
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
      callerName,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });


  socket.on('leave room', (payload) => {
    const roomID  = payload.roomID
    const userID  = payload.id
    const userName = payload.name

    users[roomID] = users[roomID].filter((user) => user.id !== userID)
    console.log('user left', users);

    // Clean up socket-related data if needed
    if(users[roomID].length === 0){
      delete users[roomID]
    }

    // Notify other users in the room about the disconnection
    users[roomID].forEach(user => {
      io.to(user.id).emit('user left', {id: userID, name: userName})
    })
  });
});


const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
