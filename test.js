var bin = require('./hex2bin.js')
	,sys_response = require('./objects.js')
	,strEX = "%01,0100000000000080$";


console.log(sys_response(strEX))

	function zoneFaults(str,num_char){
		var tmpdata = ''
		for(var i=0;i<=16;i=i+num_char){
			console.log(bin(str.substr(i,num_char)).result)
			//tmpdata = tmpdata + bin(str.substr(i,num_char)).result.split('').reverse().join('')
		}
		tmpdata.split('').map(Number).map(Boolean)
		var arrZones =[];
		for(i=0;i<=tmpdata.length;i++){
			if(tmpdata.substr(i,1)==1){ arrZones.push(i+1)}
		}
		return arrZones;
	}