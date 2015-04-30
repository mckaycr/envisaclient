var sys_response = require('./objects.js')
	,net = require('net')
	,syslog = require('syslogudp')
	,logger = syslog.createClient(514,'10.0.0.40')
	//	strReady indicates the normal state of the system
	//	I don't want to fill my syslog with this, so if this then don't log
	,strReady = "%00,01,1C08,08,00"
	,client = net.createConnection(4025, '10.0.0.205');

client.setEncoding('utf8');

client.on('data', function(data) {
	//	Login was successful, the server will now start talking to the client
	//	Envisalink seems to send multiple responses either really fast or as one response.
	//  This splits each line and processes them separate
	var arrLines = data.split('\n')
	for(i=0;i<arrLines.length-1;i++){
		// 	Check for empty responses, and anything that matches the system ready response
		//	We don't want to fill the log with those
		if(arrLines[i]!=null && arrLines[i].search(strReady)==-1){
			logger.log(sys_response(arrLines[i].trim()).raw,syslog.LOG_INFO);
		}
	};
}).on('connect', function() {
  // Immediately after connection, send login Password
  client.write('password')
	// Immediately after connection, send login Password
	logger.log('Authentication process initiated',syslog.LOG_INFO);
	client.write('password')
}).on('error', function() {
	// This occurs when the script doesn't disconnect with the server properly
	logger.log('Oops... Something is wrong. Restart you Envisalink module.',syslog.LOG_INFO);
}).on('end', function() {
	//	Connect was ended
	logger.log('Connection to Server Terminated',syslog.LOG_INFO);
});
