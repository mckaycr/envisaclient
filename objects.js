
module.exports = function(message){
	//This module accepts a string from the Envsialink and converts it to an object
	//Eamples of expected responses:
	//	%01,5C08,08,00,two line 32 byte ASCII String of test$
	//	%01,0100000000000080$
	//hex2bin will help convert some of this string into binary
    var bin = require('./hex2bin');
    //The very first part of the string will contain of the properties within the evl_ResponseType
    var evl_ResponseType = {
        'Login:' : {name:'Login Prompt',description:'Sent During Session Login Only.', handler:'login'},
        'OK' : {name:'Login Success', description: 'Send During Session Login Only, successful login', handler: 'login_success'},
        'FAILED' : {name: 'Login Failure', description: 'Sent During Session Login Only, password not accepted', handler: 'login_failure'},
        'Timed Out' : {name: 'Login Interaction Timed Out', description: 'Sent during Session Login Only, socket connection is then closed', handler: 'login_timeout'},
        '%00' : {name: 'Virtual Keypad Update', description: 'The panel wants to update the state of the keypad',handler: 'keypad_update'},
        '%01' : {type: 'zone', name: 'Zone State Change', description: 'A zone change-of-state has occurred', handler: 'zone_state_change'},
        '%02' : {type: 'partition', name: 'Partition State Change', description: 'A partition change-of-state has occured', handler: 'partition_state_change'},
        '%03' : {type: 'system', name: 'Realtime CID Event', description: 'A system event has happened that is signaled to either the Envisalerts servers or the central monitoring station', handler: 'realtime_cid_event'},
        '%FF' : {name: 'Envisalink Zone Timer Dump', description: 'This command contains the raw zone timers used inside the Envisalink. The dump is a 256 character packed HEX string representing 64 UINT16 (little endian) zone timers. Zone timers count down from 0xFFFF (zone is open) to 0x0000 (zone is closed too long ago to remember). Each tick of the zone time is actually 5 seconds so a zone timer of 0xFFFE means 5 seconds ago. Remember, the zone timers are LITTLE ENDIAN so the above example would be transmitted as FEFF.', handler: 'zone_timer_dump'},
        '^00' : {type: 'envisalink', name:'Poll', description: 'Envisalink poll', handler: 'poll_response'},
        '^01' : {type: 'envisalink', name:'Change Default Partition', description: 'Change the partition which keystrokes are sent to when using the virtual keypad.', handler: 'command_response'},
        '^02' : {type: 'envisalink', name:'Dump Zone Timers', description: 'This command contains the raw zone timers used inside the Envisalink. The dump is a 256 character packed HEX string representing 64 UINT16 (little endian) zone timers. Zone timers count down from 0xFFFF (zone is open) to 0x0000 (zone is closed too long ago to remember). Each tick of the zone time is actually 5 seconds so a zone timer of 0xFFFE means 5 seconds ago. Remember, the zone timers are LITTLE ENDIAN so the above example would be transmitted as FEFF.',handler: 'command_response'},
        '^03' : {type: 'envisalink', name:'Keypress to Specific Partition', description: 'This will send a keystroke to the panel from an arbitrary partition. Use this if you dont want to change the TPI default partition.' ,handler: 'command_response'},
        '^0C' : {type: 'envisalink', name:'Response for Invalid Command', description: 'This response is returned when an invalid command number is passed to Envisalink', handler: 'command_response'}
    };
    //If the evl_ResponseType isa Virtal Keypad Updated then this part will be the third element within the string
    var evl_Partition_Status_Code = {
        '00' : {name:'NOT_USED', description:'Partition is not used or doesn\'t exist'},
        '01' : {name:'READY', description:'Ready', pluginhandler: 'disarmed'},
        '02' : {name:'READY_BYPASS', description:'Ready to Arm (Zones are Bypasses)', pluginhandler: 'disarmed'},
        '03' : {name:'NOT_READY', description:'Not Ready', pluginhandler: 'disarmed'},
        '04' : {name:'ARMED_STAY', description:'Armed in Stay Mode', pluginhandler: 'armedHome'},
        '05' : {name:'ARMED_AWAY', description:'Armed in Away Mode', pluginhandler: 'armedAway'},
        '06' : {name:'ARMED_MAX', description:'Armed in Away Mode', pluginhandler: 'armedInstant'},
        '07' : {name:'EXIT_ENTRY_DELAY', description:'Entry or Exit Delay'},
        '08' : {name:'IN_ALARM', description:'Partition is in Alarm', pluginhandler: 'alarmTriggered'},
        '09' : {name:'ALARM_IN_MEMORY', description:'Alarm Has Occurred (Alarm in Memory)', pluginhandler: 'alarmCleared'},
    };
    //This is the fourth part of the Virtual Keypad Update
    var BEEP_field ={
        '00':'OFF',
        '01':'Beep Once',
        '02':'Beep Twice',
        '03':'Beep Thrice',
        '04':'Coninuous Fast Beep (trouble/urgency)',
        '05':'Continuous Slow Beep (exit delay)'
    };
    //This is the second part of the Virtual Keypad Update, and its a little more complicated because it comes in the form of a hex
    //which then needs to be converted to bitfield and read.  I think there is a better way of doing this.
    var iconLED = (function(bitfield){
        var status = {'ARMED STAY':bitfield[0],'LOW BATTERY':bitfield[1],'FIRE':bitfield[2],'READY':bitfield[3],
                      'Not Used1':bitfield[4],'Not Used2':bitfield[5],'CHECK ICON – SYSTEM TROUBLE':bitfield[6],
                      'ALARM (FIRE ZONE)':bitfield[7],'ARMED (ZERO ENTRY DELAY)':bitfield[8],'Not Used3':bitfield[9],
                      'CHIME':bitfield[10],'BYPASS (Zones are bypassed)':bitfield[11],'AC PRESENT':bitfield[12],
                      'ARMED AWAY':bitfield[13],'ALARM IN MEMORY':bitfield[14],'ALARM (System is in Alarm)':bitfield[15]
                    };
	    var tmp = '';
	    for (var key in status) {
	      if (status.hasOwnProperty(key) && status[key]==1) {
	        if(key.indexOf("Not Used")==-1){
	            tmp = tmp + ',' + key;
	        };
	      };
	    };
	    if(tmp[0]==','){tmp= tmp.substring(1);}

	    return tmp;
    })
	//This function takes the 8byte Hex converts it to a 64 bit bitfield. If true returns the index indicating which zones are at fault.
	//While the string is little-endian, the individual 8 bytes are normal big-endian, MSbit on the left, so there is a swap that takes place ever num_char characters
	function zoneFaults(str,num_char){
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
    //This is the final part which assigns the the converted elements into the property
	var arrResponse = message.split(',')
	objResponse = {
		type : evl_ResponseType[arrResponse[0]].name
    }
    if(arrResponse.length<=2){
    	if(arrResponse[0]=='%01'){objResponse.numeric = zoneFaults(arrResponse[1].replace('$','').trim(),2)}
    	if(arrResponse[0]=='%02'){objResponse.numeric = partStat(arrResponse[1].replace('$','').trim(),2)}
    	if(arrResponse[0]=='%03'){objResponse.numeric = sysEvnt(arrResponse[1].replace('$','').trim(),2)}
    } 
    else {
    	objResponse.type = evl_ResponseType[arrResponse[0]].name;
	    objResponse.partition = evl_Partition_Status_Code[arrResponse[1]].description;
	    objResponse.icons = iconLED(bin(arrResponse[2]).result);
	    objResponse.numeric = arrResponse[3];
	    objResponse.beeps = BEEP_field[arrResponse[4]];
	    objResponse.msg  = arrResponse[5].replace('$','').trim();
    }
    return objResponse;                
}


