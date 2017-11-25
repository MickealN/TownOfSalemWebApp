var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var gameRunning = false;
var isNight = false; // True is night, false is day
var dayCounter = 0;
var tArray = []; //Targetting Array
var vArray = [];
var voteThreshhold;


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
server.playerList = [];



io.on('connection', function(socket){
	
	//Checks if the player has an ID in the server, and if they do, marks them as dead
	//Otherwise, does nothing
	socket.on('disconnect', function(){
		if(typeof socket.player === "undefined"){
			console.log('Disconnecting a player who didnt have an ID');
			return false;
		}
		
		server.playerList[socket.player.id].alive = false;
		console.log('Disconnecting player ' + socket.player.id);
		io.emit('allplayers', server.playerList);
	});
	
	
	//Game controls, self explanitory
	socket.on('startgame', function(){
		gameRunning = true;
	});
	socket.on('startday', function(){
		if(!gameRunning){
			return false;
		}
		io.emit('senddaytable', server.playerList);
		dayCounter++;
	});
	socket.on('startnight', function(){
		if(!gameRunning){
			return false;
		}
		io.emit('sendnighttable', server.playerList);
	});
	
	socket.on('report', function(){
		if(!gameRunning){
			return false;
		}
		console.log(tArray);
		//Process results of day/night
		
		
		
		for(i = 0; i < tArray.length; i++){
			if(typeof tArray[i] != "undefined" ){
				switch(server.playerList[i].role){
					case "werewolf":
						server.playerList[tArray[i]].alive = false;
						server.playerList[tArray[i]].deathTurn = dayCounter;
						server.playerList[tArray[i]].deathCause = "werewolf";
						voteThreshhold--;
						break;
					case "townie":
						break;
				}
			
			}
		}
		
		for(i = 0; i < server.playerList.length; i++){
			
			if(server.playerList[i].deathTurn == dayCounter){
				console.log(server.playerList[i].name + " died to a " + 
				server.playerList[i].deathCause + " tonight!");
			}
			
		}
		
		
		//Clear the targetting table for next voting cycle
		tArray = [];//[server.playerList.length];
	});
	
	
	socket.on('targetplayer', function(aggroId, victimId){
		
		if(tArray[aggroId] == victimId){
			delete tArray[aggroId];
			console.log(server.playerList[aggroId].name + ' decided to stay home tonight.');
		} else {
			tArray[aggroId] = victimId;
			console.log(server.playerList[aggroId].name + ' targeted ' + server.playerList[victimId].name);
		}
	});
	
	socket.on('voteagainst', function(voterId, victimId, increment){
		
		if(isNaN(vArray[victimId])){ //initialize the element
			vArray[victimId] = 1;
		} else {
			vArray[victimId] += increment;
		}

		if(vArray[victimId] >= voteThreshhold){
			console.log(server.playerList[victimId].name + ' is now on trial.');
			//TODO: Include code that puts the voted on trial
		}
		
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
				deathTurn: -1				//-1 means alive
			
	        };
			server.playerList.push(socket.player);
			//console.log(server.playerList);
			//console.log('New Player: 	Role-' + socket.player.role + '\n		Name-' + 
				//socket.player.name + '\n		playerID-' + socket.player.id);
			socket.emit('allplayers', server.playerList, socket.player.id);
	        socket.broadcast.emit('newplayer', socket.player);
			voteThreshhold = (server.playerList.length/2) + 0.5;
		} else {
			socket.emit('gamealreadystarted');
		}
		
    });
	
	
});
