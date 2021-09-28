const express = require("express");
const http = require("http");
const path = require("path");
const Filter = require("bad-words");
const socketio = require("socket.io");
const { generateMessage, locationMessage } = require("./src/utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./src/utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicDir = path.join(__dirname, "public");

app.use(express.static(publicDir));

io.on("connection", (socket) => {
  console.log("New websocket Connection");

  //joining the chat room
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage(`Welcome ${user.username}`));

    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined!`));

    io.to(user.room).emit("allUsers", {
      users: getUsersInRoom(user.room),
      room: user.room,
    });
    callback();
  });

  socket.on("clientMessage", (msg, callback) => {
    const user = getUser(socket.id);
    if (user) {
      const filter = new Filter();
      if (filter.isProfane(msg)) {
        return callback({
          status: "Not Sent",
          optionalMsg: "Message consists of words not allowed!",
        });
      }
      socket.broadcast
        .to(user.room)
        .emit("message", generateMessage(msg), user.username);
      callback({
        status: "Delivered",
        optionalMsg: null,
      });
    }
  });

  socket.on("location", ({ lat, long } = {}, cb) => {
    const user = getUser(socket.id);

    socket.broadcast
      .to(user.room)
      .emit(
        "locationLink",
        locationMessage(`https://google.com/maps?q=${lat},${long}`),
        user.username
      );
    cb();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`)
      );
      io.to(user.room).emit("allUsers", {
        users: getUsersInRoom(user.room),
        room: user.room,
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
