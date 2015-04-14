
var evl_Response = (function(){
    var evl_ResponseType = {
        'Login' : {name:'Login Prompt',description:'Sent During Session Login Only.', handler:'login'},
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
    }
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
    }
    var BEEP_field ={
        '00':'OFF',
        '01':'Beep Once',
        '02':'Beep Twice',
        '03':'Beep Thrice',
        '04':'Coninuous Fast Beep (trouble/urgency)',
        '05':'Continuous Slow Beep (exit delay)'
    }

    //Requried in order to convert the HEX response into BIN
    var hex2bin = (function(s) {
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
    })
    //Required in order to interpret the bitfield
    var iconLED = (function(bitfield){
        var status = {'ARMED STAY':bitfield[0],'LOW BATTERY':bitfield[1],'FIRE':bitfield[2],'READY':bitfield[3],
                      'Not Used1':bitfield[4],'Not Used2':bitfield[5],'CHECK ICON – SYSTEM TROUBLE':bitfield[6],
                      'ALARM (FIRE ZONE)':bitfield[7],'ARMED (ZERO ENTRY DELAY)':bitfield[8],'Not Used3':bitfield[9],
                      'CHIME':bitfield[10],'BYPASS (Zones are bypassed)':bitfield[11],'AC PRESENT':bitfield[12],
                      'ARMED AWAY':bitfield[13],'ALARM IN MEMORY':bitfield[14],'ALARM (System is in Alarm)':bitfield[15]
                    }
        var tmp = ''
    for (var key in status) {
      if (status.hasOwnProperty(key) && status[key]==1) {
        if(key.indexOf("Not Used")==-1){
            tmp = tmp + ',' + key;
            }
      }
    }
    if(tmp[0]==','){tmp= tmp.substring(1);}

    return tmp
    })

    return {
        parse_Response: function(strInput){
            var arrResponse = strInput.split(',')

            return {
                type : evl_ResponseType[arrResponse[0]].name, 
                part : evl_Partition_Status_Code[arrResponse[1]].description,
                user : arrResponse[3],
                beep : BEEP_field[arrResponse[4]],
                msg  : arrResponse[5].replace('$','').trim()
            }
        }
    }
   
})();

//Expected response from Envisalink, This will convert to a readable string
evl_Response.parse_Response('%00,01,1C08,08,00, MCKAY\'S SYSTEM   Ready to Arm  $').type


