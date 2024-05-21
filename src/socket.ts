const http = require("http");
const { Server } = require("socket.io");
const port = 3001;
const app = require("./index");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
  },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.emit("test");
});

server.listen(port, () => {
  console.log(`socket listening on port ${port}`);
});

module.exports = io;
