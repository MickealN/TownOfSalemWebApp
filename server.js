var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var gameRunning = false;
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
	
	//The disconect code is buggy right now.
	socket.on('disconnect', function(){
		server.playerList[socket.player.id].alive = false;
		console.log('Disconnecting player ' + socket.player.id);
		io.emit('allplayers', server.playerList);
	});
	
	socket.on('startgame', function(){
		gameRunning = true;
	});
	
    socket.on('newplayer', function(data){
        if(!gameRunning){
				socket.player = {
	            id: server.lastPlayerID++,
	            role: data.playerRole,
				name: data.playerName,
				alive: true
			
	        };
			server.playerList.push(socket.player);
			console.log(server.playerList);
			//console.log('New Player: 	Role-' + socket.player.role + '\n		Name-' + 
				//socket.player.name + '\n		playerID-' + socket.player.id);
			socket.emit('allplayers', server.playerList);
	        socket.broadcast.emit('newplayer', socket.player);
		} else {
			socket.emit('gamealreadystarted');
		}
		
    });
	
	
});
