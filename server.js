var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var Backend = require('./js/Backend');

var gameRunning = false;
var isNight = false; // True is night, false is day




//app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));

//app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html'); 
});

server.listen(8081,function(){ // Listens to port 8081
    console.log('Listening on '+server.address().port);
});

server.lastPlayerID = 0;




io.on('connection', function(socket){
		
	//Checks if the player has an ID in the server, and if they do, marks them as dead
	//Otherwise, does nothing
	socket.on('disconnect', function(){
		if(typeof socket.player === "undefined"){
			console.log('Disconnecting a player who didnt have an ID');
			return false;
		}
		
		Backend.playerList[socket.player.id].alive = false;
		console.log('Disconnecting player ' + socket.player.id);
		io.emit('allplayers', Backend.playerList);
	});
	
	
	//Game controls, self explanitory
	socket.on('startgame', function(){
		gameRunning = true;
		io.emit('gamestart');
	});
	
	socket.on('startday', function(){
		if(!gameRunning){
			return false;
		}
		io.emit('senddaytable', Backend.playerList);
		Backend.dayCounter++;
	});
	
	socket.on('startnight', function(){
		if(!gameRunning){
			return false;
		}
		io.emit('sendnighttable', Backend.playerList);
	});
	
	socket.on('report', function(){
		if(!gameRunning){
			return false;
		}
		//Process results of day/night
		
		console.log(Backend.report());		
	});
	
	
	socket.on('targetplayer', function(aggroId, victimId){
		switch(Backend.targetPlayer(aggroId, victimId)){
			case 0:
				socket.emit('messagebroadcast', "You chose to target " 
					+ Backend.playerList[victimId].name + " tonight!");
				break;
			case 1:
				socket.emit('messagebroadcast', "You chose to stay home tonight!");
				break;
			case 2:
				socket.emit('messagebroadcast', "You chose to target " 
					+ Backend.playerList[victimId].name + " instead tonight!");
				break;
		}
	});
	
	socket.on('voteagainst', function(voterId, victimId, increment){
		Backend.voteAgainst(voterId, victimId, increment);
	});
	
	socket.on('messagebroadcast', function(message){
		io.emit('messagebroadcast', message);
	});

    socket.on('newplayer', function(data){
        if(!gameRunning){
				socket.player = {
	            id: server.lastPlayerID++,
	            role: data.playerRole,
				name: data.playerName,
				alive: true,
				deathCause: "",
				deathTurn: -1,				//-1 means alive
				killer: "",
				precedence: 0,
				targetedBy: [],
				targetting: -1,
				isRoleBlocked: false,
				isHealed: 0,
				isProtected: false,
				
				votesToHang: 0
	        };
			Backend.setPrecedence(socket.player);
			Backend.playerList.push(socket.player);
			//console.log('New Player: 	Role-' + Backend.player.role + '\n		Name-' + 
				//Backend.player.name + '\n		playerID-' + Backend.player.id);
			socket.emit('allplayers', Backend.playerList, socket.player.id);
	        socket.broadcast.emit('newplayer', socket.player);
			Backend.voteThreshhold = (Backend.playerList.length/2) + 0.5;
		} else {
			socket.emit('gamealreadystarted');
		}
    });
});
