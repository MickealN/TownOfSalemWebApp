var Client = {};
Client.socket = io.connect();

Client.askNewPlayer = function(){
	var name = document.getElementById("playerName");
	var role = document.getElementById("playerRole");

	if(name.value=="") {
		alert("Submit a name you twit!");
		return false;
	} else if(name.value=="mod"){
		alert("Mod tools exposed");
		document.getElementById("modtools").style.display = "inline";
		return false;
	}
    Client.socket.emit('newplayer', {playerName:name.value,
		playerRole:role.value});
};

Client.startGame = function(){
	Client.socket.emit('startgame');
};

Client.startDay = function(){
	Client.socket.emit('startday');
};

Client.startNight = function(){
	Client.socket.emit('startnight');
};

Client.socket.on('newplayer', function(data){
	document.getElementById("playerList").innerHTML += data.name;
});

Client.socket.on('allplayers', function(data){
	document.getElementById("playerList").innerHTML="";
	for(i = 0; i < data.length; i++){
		document.getElementById("playerList").innerHTML += data[i].name + "<br>";
	}
	document.getElementById("startScreen").style.display = "none";
});

Client.socket.on('gamealreadystarted', function(data){
	alert("Game has already started!");
	//Set up observer tools later.
});

Client.socket.on('gamestart', function(data){
	
	
});