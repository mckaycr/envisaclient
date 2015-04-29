//http, socket.io, and fs are required for the web server part of this app.
var app = require('http').createServer(handler)
	,io = require('socket.io')(app)
	,fs = require('fs')
	//objects is a custom module I use to translate the responses from Evnsialink
	,sys_response = require('./objects.js')
	//net is required to make the TCP connection to the Envisalink
	,net = require('net')
	//These two lines are used only if you want to record everything to a syslog server.
	,syslog = require('syslogudp')
	,logger = syslog.createClient(514,'10.0.0.40')
	//	strReady indicates the normal state of the system
	//	I don't want to fill my syslog with this, so if this then don't log
	,strReady = "%11,01,1C08,08,00"
	//This is the connection to Envisalink
	,client = net.createConnection(4025, '10.0.0.205');

//have no idea what this does besides maybe error handling in case the index file doesn't exist
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

//handle comms between the web server and the web clients
io.on('connection', function (socket) {
	//once a webclient has connected, send this object to their browser.
  	socket.emit('news', 'Server established connection to Client');
  	//their browser will respond immediately on connection with this
  	socket.on('my other event', function (data) {
  	//That response so sent to console
    console.log(data);
  }).on('data',function(data){
  	console.log('This happens when a button is clicked')
	})
});
//Starts web server
app.listen(80)

//handles comms to and from the envisaclient
client.setEncoding('utf8');
client.on('data', function (resp) {
	//	Login was successful, the server will now start talking to the client
	//	Envisalink seems to send multiple responses either really fast or as one response.
	//  This splits each line and processes them separate
	var arrLines = resp.split('\n')
	for(i=0;i<arrLines.length-1;i++){
		// 	Check for empty responses, and anything that matches the system ready response
		//	We don't want to fill the log with those
		if(arrLines[i]!=null && arrLines[i].search(strReady)==-1){
			console.log(arrLines[i])
			logger.log(sys_response(arrLines[i].trim()).raw,syslog.LOG_INFO);
			//socket.emit('news',sys_response(arrLines[i].trim()).raw)
		}
	};
}).on('connect', function() {
	// Immediately after connection, send login Password
	logger.log('Authentication process initiated',syslog.LOG_INFO);
	//send password to EnvisaLink
	client.write('password')
}).on('error', function() {
	// The server is already connected to something (or thinks it is)
	logger.log('Oops... Something is wrong. Restart you Envisalink module.',syslog.LOG_INFO);
}).on('end', function() {
	//	Connect was ended
	logger.log('Connection to Server Terminated',syslog.LOG_INFO);
});
