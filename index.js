/**                                                              +-->
 *                                                               |
 *             Share this URL with friends **after forking** ----+
 * 
 * README:
 * 
 * Make sure to **fork this project** and play on your own fork, 
 * as each server only supports 1 game at a time!
 * 
 * To share with your friend, copy over the URL to the right 
 * (ex. https://competitive-2048-demo--mikeshi42.repl.co) and
 * send it to them to connect!
 * 
 * Alternatively to test with yourself, just click on the
 * "Open in New Tab" button right of the URL bar on the 
 * window to the right.
 */

const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.Server(app);
const io = socketio(server); // Attach socket.io to our server

app.use(express.static('public')); // Serve our static assets from /public

server.listen(3000, () => console.log('server started'));

let lobbyIndex = 0 
const connections = new Array(1000).fill(null);
const lobbies = {}

const uid = function(){
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
// Handle a socket connection request from web client
io.on('connection', function (socket) {
  
  // Find an available player number
  let playerIndex = -1;
  for (const i in connections) {
    if (i === null) {
      playerIndex = i;
    }
  }
  console.log('final player index:', playerIndex)
  
  // Tell the connecting client what player number they are
  socket.emit('player-number', playerIndex);
  
  console.log(`Player ${playerIndex} has connected`);
  
  // Ignore player 3
  if (playerIndex == -1) return;
  
  connections[playerIndex] = socket;
  if (Object.entries(lobbies).length === 0) {
    id = uid()
    lobbies.id = { "player1": playerIndex, "player2": -1, "socket1": socket, "socket2": null }
    lobbies.id.socket1.emit('lobby-id', id)
  } else {
    for (const [lobbyId, lobby] in Object.entries(lobbies)) {
      if (lobby.player2 === -1) {
        lobby.player2 = playerIndex
        lobby.socket2 = socket
        // Tell everyone else what player number just connected
        lobby.socket1.emit('player-connect', 2)
        lobby.socket2.emit('player-connect', 2)
        lobby.socket2.emit('lobby-id', id)
      }
    }
  }
  
  socket.on('actuate', function (data) {
    console.log(`Actuation from ${playerIndex}`);

    const { grid, metadata, lobbyId } = data; // Get grid and metadata properties from client
    
    const move = {
      playerIndex,
      grid,
      metadata,
    };

    // Emit the move to all other clients
    lobbies.lobbyId.socket1.emit('move', move);
    lobbies.lobbyId.socket2.emit('move', move);
  });

  socket.on('disconnect', function() {
    console.log(`Player ${playerIndex} Disconnected`);
    delete connections[playerIndex]
    for ([lobbyId, lobby] in Object.entries(lobbies)) {
      if (lobby.player1 === playerIndex || lobby.player2 === playerIndex) {
        delete lobbies.lobbyId
      }
    }
  });


});

