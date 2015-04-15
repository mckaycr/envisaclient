var bin = require('./hex2bin.js')
	,sys_response = require('./objects.js')
	//strEX is the expected response from Envisalink
	,strEX = "%00,01,1C08,08,00, MCKAY'S SYSTEM   Ready to Arm  $"
	,data = endianSwap('1000000000000000',2)
	,Bitfield = require('bitfield')
	,field = new Bitfield(data.length);

//Testing objects.js output
console.log(sys_response(strEX).type)


//Test decoding of the zone/partition state change response 

for(i=0;i<=data.length;i++){
	field.set(i,data[i])
	if(field.get(i)==true)console.log('Zone '+(i+1)+' is open/faulted')
}

// 
function endianSwap(str,num_char){
	tmpdata = ''
	for(i=0;i<=16;i=i+num_char){
		tmpdata = tmpdata + reverseString(bin(str.substr(i,num_char)).result)
	}
 	return tmpdata.split('').map(Number).map(Boolean)
}
// Reverse the characters in a string
function reverseString(str) {
	return str.split('').reverse().join('');
}
