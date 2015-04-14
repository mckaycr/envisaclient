var sys_response = require('./objects.js');

//strEX is the expected response from Envisalink
var strEX = "%00,01,1C08,08,00, MCKAY'S SYSTEM   Ready to Arm  $"

//will be the response from the objects.js
console.log(sys_response(strEX).msg)
