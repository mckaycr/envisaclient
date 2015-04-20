var sys_response = require('./objects.js');
var net = require('net')
	,syslog = require('syslogudp')
	,logger = syslog.createClient(514,'10.0.0.40');
var strReady = "%00,01,1C08,08,00, MCKAY'S SYSTEM   Ready to Arm  $"
var client = net.createConnection(4025, '10.0.0.205');
client.setEncoding('utf8');
client.on('data', function(data) {
  var arrLines = data.split('\n')
	for(i=0;i<arrLines.length-1;i++){
		if(arrLines[i]!=null){
			//console.log(arrLines[i].trim().length)
			console.log(sys_response(arrLines[i].trim()).type)
		}
		//logger.log(arrLines[i],syslog.LOG_INFO);
		
	};
}).on('connect', function() {
  // Immediately after connection, send login Password
  client.write('MoeBas')
}).on('end', function() {
  console.log('DONE');
});