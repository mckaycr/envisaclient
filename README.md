#### Envisaclient ####

This project uses the [Ademco TPI provided by Eyez-On](http://forum.eyez-on.com/FORUM/viewtopic.php?f=6&t=301). It processes events from the Envisalink server.

This project was originally a fork of the [AlarmServer project for DSC panels](https://github.com/juggie/AlarmServer) - credit to them for the base code.   However, the API's between DSC and Honeywell are so different that it didn't make sense to try to maintain a single codebase.  In comes the next credit which goes to [MttTW/HoneyAlarmServer](https://github.com/MattTW/HoneyAlarmServer) who implemented the TPI specific to the Ademco Panel.

This project uses the concepts from the above mentions to implement something that works with NodeJS.  

This is my first GitHub project, and I'm still learning how it all works.  The reason I am using it is because I'm a noob at Node, and at javascript.  So by making it public, I'm welcoming input from more experianced programmers.  

#### What Works ####

 + Connection to the Envisalink is established
 + Events are being recieved and are currently being sent to a syslog server
 + The response string from the Envisalink is being converted into an object with properties that match the TPI documentation

#### What Doesn't Work ####
  + Everything else...
  + Haven't started working on sending commands
  + No UI started
  + Not even sure where to begin with impleneting API commands

Config
--------
Everything is hardcoded right now as I'm still working on my initial build.

Dependencies:
-------------
[NodeJS](https://nodejs.org/) is required

At the moment [syslogUDP](https://www.npmjs.com/package/syslogudp) is required.

[Bitfield](https://github.com/fb55/bitfield) is required.

[Socket.io](http://socket.io) is required
