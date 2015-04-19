var bin = require('./hex2bin.js')
	//sys_response = require('./objects.js');

console.log(testZones = arrZones('0100000000000080',2))


//Test decoding of the zone/partition state change response 

function arrZones(str,num_char){
	var tmpdata = ''
	for(var i=0;i<=16;i=i+num_char){
		tmpdata = tmpdata + bin(str.substr(i,num_char)).result.split('').reverse().join('')
	}
	tmpdata.split('').map(Number).map(Boolean)
	var arrZones =[];
	for(i=0;i<=tmpdata.length;i++){
		if(tmpdata.substr(i,1)==1){ arrZones.push(i+1)}
	}
	return arrZones;
}
