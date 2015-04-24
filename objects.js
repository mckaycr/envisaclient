//This module accepts a string from the Envsialink and converts it to an object
//Eamples of expected responses:
//	%01,5C08,08,00,two line 32 byte ASCII String of test$
//	%01,0100000000000080$
module.exports = function(message){
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
    var evl_CID_Qualifiers = {
	    1 : 'New Event or Opening',
	    3 : 'New Restore or Closing',
	    6 : 'Previously Reported Condition Still Present'
	};
	var evl_CID_Events = {
	    100 : {"label" : "Medical Alert","type"  : "zone",},
	    101 : {"label" : "Personal Emergency","type"  : "zone",},
	    102 : {"label" : "Failure to Report In","type"  : "zone",},
	    110 : {"label" : "Fire Alarm","type"  : "zone",},
	    111 : {"label" : "Smoke Alarm","type"  : "zone",},
	    112 : {"label" : "Combustion Detected Alarm","type"  : "zone",},
	    113 : {"label" : "Water Flood Alarm","type"  : "zone",},
	    114 : {"label" : "Excessive Heat Alarm","type"  : "zone",},
	    115 : {"label" : "Fire Alarm Pulled","type"  : "zone",},
	    116 : {"label" : "Duct Alarm","type"  : "zone",},
	    117 : {"label" : "Flame Detected","type"  : "zone",},
	    118 : {"label" : "Near Alarm","type"  : "zone",},
	    120 : {"label" : "Panic Alarm","type"  : "zone",},
	    121 : {"label" : "Duress Alarm","type"  : "user",},
	    122 : {"label" : "Alarm, 24-hour Silent","type"  : "zone",},
	    123 : {"label" : "Alarm, 24-hour Audible","type"  : "zone",},
	    124 : {"label" : "Duress - Access granted","type"  : "zone",},
	    125 : {"label" : "Duress - Egress granted","type"  : "zone",},
	    130 : {"label" : "Burgalry in Progress","type"  : "zone",},
	    131 : {"label" : "Alarm, Perimeter","type"  : "zone",},
	    132 : {"label" : "Alarm, Interior","type"  : "zone",},
	    133 : {"label" : "24 Hour (Safe)","type"  : "zone",},
	    134 : {"label" : "Alarm, Entry/Exit","type"  : "zone",},
	    135 : {"label" : "Alarm, Day/Night","type"  : "zone",},
	    136 : {"label" : "Alarm, Outdoor","type"  : "zone",},
	    137 : {"label" : "Alarm, Tamper","type"  : "zone",},
	    138 : {"label" : "Near Alarm","type"  : "zone",},
	    139 : {"label" : "Intrusion Verifier","type"  : "zone",},
	    140 : {"label" : "Alarm, General Alarm","type"  : "zone",},
	    141 : {"label" : "Alarm, Polling Loop Open","type"  : "zone",},
	    142 : {"label" : "Alarm, Polling Loop Short","type"  : "zone",},
	    143 : {"label" : "Alarm, Expansion Module","type"  : "zone",},
	    144 : {"label" : "Alarm, Sensor Tamper","type"  : "zone",},
	    145 : {"label" : "Alarm, Expansion Module Tamper","type"  : "zone",},
	    146 : {"label" : "Silent Burglary","type"  : "zone",},
	    147 : {"label" : "Sensor Supervision failure","type"  : "zone",},
	    150 : {"label" : "Alarm, 24-Hour Auxiliary","type"  : "zone",},
	    151 : {"label" : "Alarm, Gas detected","type"  : "zone",},
	    152 : {"label" : "Alarm, Refrigeration","type"  : "zone",},
	    153 : {"label" : "Alarm, Loss of heat","type"  : "zone",},
	    154 : {"label" : "Alarm, Water leakage","type"  : "zone",},
	    155 : {"label" : "Alarm, foil break","type"  : "zone",},
	    156 : {"label" : "Day trouble","type"  : "zone",},
	    157 : {"label" : "Low bottled gas level","type"  : "zone",},
	    158 : {"label" : "Alarm, High temperature","type"  : "zone",},
	    159 : {"label" : "Alarm, Low temperature","type"  : "zone",},
	    161 : {"label" : "Alarm, Loss of air flow","type"  : "zone",},
	    162 : {"label" : "Alarm, Carbon Monoxide Detected","type"  : "zone",},
	    163 : {"label" : "Alarm, Tank Level","type"  : "zone",},
	    300 : {"label" : "System Trouble","type"  : "zone",},
	    301 : {"label" : "AC Power","type"  : "zone",},
	    302 : {"label" : "Low System Battery/Battery Test Fail","type"  : "zone",},
	    303 : {"label" : "RAM Checksum Bad","type"  : "zone",},
	    304 : {"label" : "ROM Checksum Bad","type"  : "zone",},
	    305 : {"label" : "System Reset","type"  : "zone",},
	    306 : {"label" : "Panel programming changed","type"  : "zone",},
	    307 : {"label" : "Self-test failure","type"  : "zone",},
	    308 : {"label" : "System shutdown","type"  : "zone",},
	    309 : {"label" : "Battery test failure","type"  : "zone",},
	    310 : {"label" : "Ground fault","type"  : "zone",},
	    311 : {"label" : "Battery Missing/Dead","type"  : "zone",},
	    312 : {"label" : "Power Supply Overcurrent","type"  : "zone",},
	    313 : {"label" : "Engineer Reset","type"  : "user",},
	    321 : {"label" : "Bell/Siren Trouble","type"  : "zone",},
	    333 : {"label" : "Trouble or Tamper Expansion Module","type"  : "zone",},
	    341 : {"label" : "Trouble, ECP Cover Tamper","type"  : "zone",},
	    344 : {"label" : "RF Receiver Jam","type"  : "zone",},
	    351 : {"label" : "Telco Line Fault","type"  : "zone",},
	    353 : {"label" : "Long Range Radio Trouble","type"  : "zone",},
	    373 : {"label" : "Fire Loop Trouble","type"  : "zone",},
	    374 : {"label" : "Exit Error Alarm","type"  : "zone",},
	    380 : {"label" : "Global Trouble, Trouble Day/Night","type"  : "zone",},
	    381 : {"label" : "RF Supervision Trouble","type"  : "zone",},
	    382 : {"label" : "Supervision Auxillary Wire Zone","type"  : "zone",},
	    383 : {"label" : "RF Sensor Tamper","type"  : "zone",},
	    384 : {"label" : "RF Sensor Low Battery","type"  : "zone",},
	    393 : {"label" : "Clean Me","type"  : "zone",},
	    401 : {"label" : "AWAY/MAX","type"  : "user",},
	    403 : {"label" : "Scheduled Arming","type"  : "user",},
	    406 : {"label" : "Cancel by User","type"  : "user",},
	    407 : {"label" : "Remote Arm/Disarm (Downloading)","type"  : "user",},
	    408 : {"label" : "Quick AWAY/MAX","type"  : "user",},
	    409 : {"label" : "AWAY/MAX Keyswitch","type"  : "user",},
	    411 : {"label" : "Callback Requested","type"  : "user",},
	    412 : {"label" : "Success-Download/Access","type"  : "user",},
	    413 : {"label" : "Unsuccessful Access","type"  : "user",},
	    414 : {"label" : "System Shutdown","type"  : "user",},
	    415 : {"label" : "Dialer Shutdown","type"  : "user",},
	    416 : {"label" : "Successful Upload","type"  : "user",},
	    421 : {"label" : "Access Denied","type"  : "user",},
	    422 : {"label" : "Access Granted","type"  : "user",},
	    423 : {"label" : "PANIC Forced Access","type"  : "zone",},
	    424 : {"label" : "Egress Denied","type"  : "user",},
	    425 : {"label" : "Egress Granted","type"  : "user",},
	    426 : {"label" : "Access Door Propped Open","type"  : "zone",},
	    427 : {"label" : "Access Point DSM Trouble","type"  : "zone",},
	    428 : {"label" : "Access Point RTE Trouble","type"  : "zone",},
	    429 : {"label" : "Access Program Mode Entry","type"  : "user",},
	    430 : {"label" : "Access Program Mode Exit","type"  : "user",},
	    431 : {"label" : "Access Threat Level Change","type"  : "user",},
	    432 : {"label" : "Access Relay/Triger Failure","type"  : "zone",},
	    433 : {"label" : "Access RTE Shunt","type"  : "zone",},
	    434 : {"label" : "Access DSM Shunt","type"  : "zone",},
	    441 : {"label" : "STAY/INSTANT","type"  : "user",},
	    442 : {"label" : "STAY/INSTANT Keyswitch","type"  : "user",},
	    570 : {"label" : "Zone Bypass","type"  : "zone",},
	    574 : {"label" : "Group Bypass","type"  : "user"},
	    601 : {"label" : "Operator Initiated Dialer Test","type"  : "user",},
	    602 : {"label" : "Periodic Test","type"  : "zone",},
	    606 : {"label" : "AAV to follow","type"  : "zone",},
	    607 : {"label" : "Walk Test","type"  : "user",},
	    623 : {"label" : "Event Log 80% Full","type"  : "zone",},
	    625 : {"label" : "Real-Time Clock Changed","type"  : "user",},
	    627 : {"label" : "Program Mode Entry","type"  : "zone",},
	    628 : {"label" : "Program Mode Exit","type"  : "zone",},
	    629 : {"label" : "1-1/3 Day No Event","type"  : "zone",},
	    642 : {"label" : "Latch Key","type"  : "user",}
	};
    //Returns an array of partition statuses where the index + 1 is the partition number
    function partStat(str){
    	var arrTemp = [];
    	for(var i=0;i<=str.length-1;i++){
    		var tmp = str.substr(i,2)
    		arrTemp.push(evl_Partition_Status_Code[tmp])
    		i++
    	}
    	return arrTemp;
    }
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
    	if(arrResponse[0]=='%02'){objResponse.numeric = partStat(arrResponse[1].replace('$','').trim())}
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
    objResponse.raw = message;
    return objResponse;                
}


