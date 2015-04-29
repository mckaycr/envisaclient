// Envisalink Emulator, sends login response and expected ready response.

// Load the TCP Library
net = require('net');
 
// Keep track of the chat clients
var clients = [];
 
// Start a TCP Server
net.createServer(function (socket) {
 
  // Identify this client
  socket.setEncoding('utf8');
  socket.name = socket.remoteAddress + ":" + socket.remotePort 
 
  // Put this new client in the list
  clients.push(socket);
 
  // Send login prompt to client
  socket.write("Login:  \r\n");
  //broadcast(socket.name + " joined the chat\n", socket);
 
  // Handle response from client
  socket.on('data', function(data) {
    console.log(data)
      if(data.substr(0,1)!='%'){socket.write('OK  \r\n');}
  });
 
  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    //broadcast(socket.name + " left the chat.\n");
    if(clients.length==0){myStopFunction()}
  });

  socket.on('error', function() {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left the chat.\n");
    if(clients.length==0){myStopFunction()}
  });
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message);
    });
    // Log it to the server output too

    process.stdout.write(message)
  }


if(clients.length>=1){
  var myVar = setInterval(function(){broadcast("%00,01,1C08,08,00, MCKAY'S SYSTEM   Ready to Arm  $\r\n")}, 3000);
}
else{
  myStopFunction();
}

function myStopFunction() {
    clearInterval(myVar);
}

}).listen(4025);
 
// Put a friendly message on the terminal of the server.
console.log("Envisalink Emulator Listening on port 4025\n");
