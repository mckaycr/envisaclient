#### Envisaclient ####

This project uses the [Ademco TPI provided by Eyez-On](http://forum.eyez-on.com/FORUM/viewtopic.php?f=6&t=301). It processes events from the Envisalink server.

This project was originally a fork of the [AlarmServer project for DSC panels](https://github.com/juggie/AlarmServer) - credit to them for the base code.   However, the API's between DSC and Honeywell are so different that it didn't make sense to try to maintain a single codebase.  In comes the next credit which goes to [MttTW/HoneyAlarmServer](https://github.com/MattTW/HoneyAlarmServer) who implemented the TPI specific to the Ademco Panel.

This project uses the concepts from the above mentions to implement something that works with NodeJS.  

This is my first GitHub project, and I'm still learning how it all works.  The reason I am using it is because I'm a noob at Node, and at javascript.  So by making it public, I'm welcoming input from more experianced programmers.  

#### What Works ####

 + Connection to the Envisalink is established
 + Web server starts (I'm using [ExpressJS](http://expressjs.com/) now since there seems to be a lot of modules build for it like authentication and stuff)
 + The web interface can send and receive commands

#### What Doesn't Work ####
  + Everything else...
  + Not even sure where to begin with impleneting API commands
   
#### Things to do ####
  + I want to integrate [Passport](http://passportjs.org/) for authentication, but I also want something that can store user based configs.
  + Eventually going to need to manage user accounts along with user specific settings.  I'm open to ideas.  Probably going to use [redis](http://redis.io/) for the database (if I understand what redis is even for).

Config
--------
Everything is hardcoded right now as I'm still working on my initial build.
So if you have node already installed, then you should just be able to download this repository, then from inside the root folder just type

```
npm install

```

This starts the server

```
node bin/www
```

However if you don't have an envisalink to connect too, I'm to really sure you will see much going on.  I have created a separate project for an [Envisalink Emulator](https://github.com/mckaycr/EnvisalinkEmu), but its a work in progress as well.


Dependencies:
-------------
[NodeJS](https://nodejs.org/) is required

This will download the rest of the dependencies

```
npm install

```

Special Thanks
---------------
[Koding](https://koding.com)
![koding](https://assets.brandfolder.com/odxjy2-1vxsm0-4mqaom/original/Koding_Logo_Color.png = 20%)
