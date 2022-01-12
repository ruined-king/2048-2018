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
const connections = new Array(1000).fill(false);
const lobbies = {}

const uid = function(){
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
// Handle a socket connection request from web client
io.on('connection', function (socket) {
  
  // Find an available player number
  let playerIndex = -1;
  let lobbyId = -1

  if (Object.entries(lobbies).length === 0) {
    id = uid()
    lobbyId = id
    playerIndex = 1
    console.log(`Player ${playerIndex} has connected`);
    lobbies[id] = { "player1": 1, "player2": -1, "socket1": socket, "socket2": null }
    lobbies[id].socket1.emit('lobby-id', id)
    lobbies[id].socket1.emit('player-number', 1);
    
  } else {
    for (const [lobbyId, lobby] of Object.entries(lobbies)) {
      if (lobby.player2 === -1) {
        playerIndex = 0
        console.log(`Player ${playerIndex} has connected`);
        lobby.player2 = 0
        lobby.socket2 = socket
        // Tell everyone else what player number just connected
        lobby.socket2.emit('lobby-id', lobbyId)
        lobby.socket2.emit('player-number', 0)
        lobby.socket1.emit('player-connect', 0)
        lobby.socket2.emit('player-connect', 0)
      }
    }
  }

  console.log('lobbies: ', lobbies)
  socket.on('actuate', function (data) {
    console.log(`Actuation from ${playerIndex}`);
    console.log(data)
    const { grid, metadata, lobbyId } = data; // Get grid and metadata properties from client
    console.log('lobbyId: ', lobbyId)
    const move = {
      playerIndex,
      grid,
      metadata,
    };
    if (lobbies[lobbyId].player1 == playerIndex) {
      lobbies[lobbyId].socket2.emit('move', move);
    } else {
      lobbies[lobbyId].socket1.emit('move', move);
    }
    // Emit the move to all other clients
    lobbies[lobbyId].socket1.emit('move', move);
    lobbies[lobbyId].socket2.emit('move', move);
  });

  socket.on('disconnect', function() {
    console.log(`Player ${playerIndex} Disconnected`);
    delete lobbies[lobbyId]
    console.log('lobbies: ', lobbies)
  });


});

