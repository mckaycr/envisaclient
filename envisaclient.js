var net = require('net')
	,syslog = require('syslogudp')
	,logger = syslog.createClient(514,'10.0.0.40');
var client = new net.Socket();
var strReady = '%00,01,1C08,08,00, MCKAY\'S SYSTEM   Ready to Arm  $'

client.setEncoding('utf8');
client.connect(4025, '10.0.0.205', function() {
	logger.log('Initiating Envisalink client connection...', syslog.LOG_INFO);
	client.write('user');
});

client.on('data', function(data) {
	var arrLines = data.split('\n')
	for(i=0;i<arrLines.length-1;i++){
		if(arrLines[i]!=strReady){
			logger.log(arrLines[i],syslog.LOG_INFO);
			console.log(arrLines[i]);
		};
	};
});
 
client.on('close', function() {
	console.log('Connection closed');
});

