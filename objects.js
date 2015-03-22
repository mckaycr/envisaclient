var evl_ResponseType = {
    Login:{name:'Login Prompt',description:'Sent During Session Login Only.', handler:'login'},
    OK:{name:'Login Success', description: 'Send During Session Login Only, successful login', handler: 'login_success'},
    FAILED:{name: 'Login Failure', description: 'Sent During Session Login Only, password not accepted', handler: 'login_failure'},
    TimedOut:{name: 'Login Interaction Timed Out', description: 'Sent during Session Login Only, socket connection is then closed', handler: 'login_timeout'},
    R00:{name: 'Virtual Keypad Update', description: 'The panel wants to update the state of the keypad',handler: 'keypad_update'},
    R01:{type: 'zone', name: 'Zone State Change', description: 'A zone change-of-state has occurred', handler: 'zone_state_change'},
    R02:{type: 'partition', name: 'Partition State Change', description: 'A partition change-of-state has occured', handler: 'partition_state_change'},
    R03:{type: 'system', name: 'Realtime CID Event', description: 'A system event has happened that is signaled to either the Envisalerts servers or the central monitoring station', handler: 'realtime_cid_event'},
    RFF:{name: 'Envisalink Zone Timer Dump', description: 'This command contains the raw zone timers used inside the Envisalink. The dump is a 256 character packed HEX string representing 64 UINT16 (little endian) zone timers. Zone timers count down from 0xFFFF (zone is open) to 0x0000 (zone is closed too long ago to remember). Each tick of the zone time is actually 5 seconds so a zone timer of 0xFFFE means 5 seconds ago. Remember, the zone timers are LITTLE ENDIAN so the above example would be transmitted as FEFF.', handler: 'zone_timer_dump'},
    T00:{type: 'envisalink', name:'Poll', description: 'Envisalink poll', handler: 'poll_response'},
    T01:{type: 'envisalink', name:'Change Default Partition', description: 'Change the partition which keystrokes are sent to when using the virtual keypad.', handler: 'command_response'},
    T02:{type: 'envisalink', name:'Dump Zone Timers', description: 'This command contains the raw zone timers used inside the Envisalink. The dump is a 256 character packed HEX string representing 64 UINT16 (little endian) zone timers. Zone timers count down from 0xFFFF (zone is open) to 0x0000 (zone is closed too long ago to remember). Each tick of the zone time is actually 5 seconds so a zone timer of 0xFFFE means 5 seconds ago. Remember, the zone timers are LITTLE ENDIAN so the above example would be transmitted as FEFF.',handler: 'command_response'},
    T03:{type: 'envisalink', name:'Keypress to Specific Partition', description: 'This will send a keystroke to the panel from an arbitrary partition. Use this if you dont want to change the TPI default partition.' ,handler: 'command_response'},
    T0C:{type: 'envisalink', name:'Response for Invalid Command', description: 'This response is returned when an invalid command number is passed to Envisalink', handler: 'command_response'}
};
evl_Partition_Status_Codes = {
    P00 : {name:'NOT_USED', description:'Partition is not used or doesn\'t exist'},
    P01 : {name:'READY', description:'Ready', pluginhandler: 'disarmed'},
    P02 : {name:'READY_BYPASS', description:'Ready to Arm (Zones are Bypasses)', pluginhandler: 'disarmed'},
    P03 : {name:'NOT_READY', description:'Not Ready', pluginhandler: 'disarmed'},
    P04 : {name:'ARMED_STAY', description:'Armed in Stay Mode', pluginhandler: 'armedHome'},
    P05 : {name:'ARMED_AWAY', description:'Armed in Away Mode', pluginhandler: 'armedAway'},
    P06 : {name:'ARMED_MAX', description:'Armed in Away Mode', pluginhandler: 'armedInstant'},
    P07 : {name:'EXIT_ENTRY_DELAY', description:'Entry or Exit Delay'},
    P08 : {name:'IN_ALARM', description:'Partition is in Alarm', pluginhandler: 'alarmTriggered'},
    P09 : {name:'ALARM_IN_MEMORY', description:'Alarm Has Occurred (Alarm in Memory)', pluginhandler: 'alarmCleared'}
}

function hex2bin(s) {
    var i, k, part, ret = '';
    // lookup table for easier conversion. '0' characters are padded for '1' to '7'
    var lookupTable = {
        '0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100',
        '5': '0101', '6': '0110', '7': '0111', '8': '1000', '9': '1001',
        'a': '1010', 'b': '1011', 'c': '1100', 'd': '1101',
        'e': '1110', 'f': '1111',
        'A': '1010', 'B': '1011', 'C': '1100', 'D': '1101',
        'E': '1110', 'F': '1111'
    };
    for (i = 0; i < s.length; i += 1) {
        if (lookupTable.hasOwnProperty(s[i])) {
            ret += lookupTable[s[i]];
        } else {
            return { valid: false };
        }
    }
    return { valid: true, result: ret };
}
function iconLED(bitfield){
	var status = {'ARMED STAY':bitfield[0],'LOW BATTERY':bitfield[1],'FIRE':bitfield[2],'READY':bitfield[3],
				  'Not Used1':bitfield[4],'Not Used2':bitfield[5],'CHECK ICON – SYSTEM TROUBLE':bitfield[6],
				  'ALARM (FIRE ZONE)':bitfield[7],'ARMED (ZERO ENTRY DELAY)':bitfield[8],'Not Used3':bitfield[9],
				  'CHIME':bitfield[10],'BYPASS (Zones are bypassed)':bitfield[11],'AC PRESENT':bitfield[12],
				  'ARMED AWAY':bitfield[13],'ALARM IN MEMORY':bitfield[14],'ALARM (System is in Alarm)':bitfield[15]
				}
	var tmp = ''
for (var key in status) {
  if (status.hasOwnProperty(key) && status[key]==1) {
    tmp = tmp + ',' + key;
  }
}
return tmp
}
function parse_Response(strInput){
	arrResponse = strInput.split(',')
	code = arrResponse[0].replace(' ','').replace(':','').replace('%',"R").replace('^','T')
	if(evl_ResponseType[code]){tmpResponse = evl_ResponseType[code].name}
	if(arrResponse[1].length==2){
		partition = evl_Partition_Status_Codes['P'+arrResponse[1]].description
	}
	return tmpResponse + '\n' + partition + '\niconLED:' + iconLED(hex2bin(arrResponse[2]).result)
	+ '\nUser:' + arrResponse[3] + '\nBeepCode:' + arrResponse[4] + '\n' + arrResponse[5].replace('$','').trim()
};

//console.log(hex2bin(iconLED('1C08'))
//console.log(parse_Response('%00,01,1C08,08,00, MCKAY\'S SYSTEM   Ready to Arm  $'));

