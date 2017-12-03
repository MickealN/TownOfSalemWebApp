var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var Backend = require('./js/Backend');

Backend.gameRunning = false;
var isNight = false; // True is night, false is day
var voteTriggered = false;
var ifVictim = -1;





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

//Used to represent the current game state. 0 for day voting, 1 for night, 2 for status reporting 
server.currentPhase = 0; 
server.onTrial = -1;




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
		Backend.gameRunning = true;
		io.emit('gamestart');
	});


	//Does the required actions and sets the phase variable to the next appropriate phase. 
	socket.on('nextphase', function(){
		if(!Backend.gameRunning){
			Backend.playerList = [];
			io.emit('endscreen', Backend.victoryLine);
			process.exit();
			return false;
		}
		switch (server.currentPhase){
			case 0:
				console.log("Game Phase: " + server.currentPhase);
				io.emit('senddaytable', Backend.playerList);
				Backend.dayCounter++;
				server.currentPhase = 1;
				break;
			case 1:
				if(voteTriggered){
					var outcome = Backend.verdict(ifVictim);
					console.log(outcome);
					io.emit('messagebroadcast', outcome);
					server.currentPhase = 2;
					voteTriggered = false;
					ifVictim = -1;
					break;	
				}
			case 2:
				console.log("Game Phase: " + server.currentPhase);
				io.emit('sendnighttable', Backend.playerList);
				server.currentPhase = 3
				break;
			case 3:
				console.log("Game Phase: " + server.currentPhase);
				console.log(Backend.report());
				server.currentPhase = 0;
				break;				
		}
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
		ifVictim = Backend.voteAgainst(voterId, victimId, increment);
		if(ifVictim != -1){
			io.emit('starttrial', Backend.playerList[ifVictim].name);
			voteTriggered = true;
		}
	});
	
	socket.on('messagebroadcast', function(message){
		io.emit('messagebroadcast', message);
	});
	
	socket.on('voteinnocent', function(){
		socket.player.vote = -1;
	});

	socket.on('voteguilty', function(){
		socket.player.vote = 1;
	});
	
    socket.on('newplayer', function(data){
        if(!Backend.gameRunning){
				socket.player = {
	            id: server.lastPlayerID++,
	            role: data.playerRole,
				name: data.playerName,
				alive: true,
				deathCause: "",
				deathTurn: -1,				//-1 means alive
				killer: "",
				precedence: 0,
				alignmnet: "",
				targetedBy: [],
				targetting: -1,
				isRoleBlocked: false,
				isHealed: 0,
				isProtected: false,
				vote: 0,
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
