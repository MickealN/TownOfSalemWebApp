var Client = {};
Client.socket = io.connect();
var playerRole;
var myId;
var totalPlayers = 0;
var alreadyVotedFor = -1;
var currentTable;


//Grabs the inputted information from the webpage and submits it to the server
//Entering "mod" into playername will display the game moderator controls.
//This has not been made a button as to prevent THOSE DINKS FROM MESSING WITH MY CONTROL OF THE GAME
Client.askNewPlayer = function(){
	var name = document.getElementById("playerName");
	var role = document.getElementById("playerRole");

	if(name.value=="") {
		alert("Submit a name you twit!");
		return false;
	} else if(name.value=="mod"){
		//alert("Mod tools exposed");
		document.getElementById("modtools").style.display = "inline";
		return false;
	}
	playerRole = role.value;
    Client.socket.emit('newplayer', {playerName:name.value,
		playerRole:role.value});
};

Client.targetPlayer = function(aggroId, victimId){
	Client.socket.emit('targetplayer', aggroId, victimId);
};

Client.voteAgainst = function(voterId, victimId){
	if(alreadyVotedFor == -1){
		Client.socket.emit('voteagainst', voterId, victimId, 1);
		Client.socket.emit('messagebroadcast', currentTable[voterId].name + "  voted against "
		+ currentTable[victimId].name+"!");
		alreadyVotedFor = victimId;
	} else if(alreadyVotedFor == victimId) {
		Client.socket.emit('voteagainst', voterId, alreadyVotedFor, -1);
		Client.socket.emit('messagebroadcast', currentTable[voterId].name + " cancelled their vote!");
		alreadyVotedFor = -1;
	} else {
		Client.socket.emit('voteagainst', voterId, alreadyVotedFor, -1);
		Client.socket.emit('voteagainst', voterId, victimId, 1);
		Client.socket.emit('messagebroadcast', currentTable[voterId].name + "  changed their vote to "
		+ currentTable[victimId].name+"!");
		alreadyVotedFor = victimId;
	}
};



//Moderator Controls. Self explanitory.
Client.startGame = function(){
	Client.socket.emit('startgame');
};

Client.startDay = function(){
	Client.socket.emit('startday');
};

Client.startNight = function(){
	Client.socket.emit('startnight');
};
Client.report = function(){
	Client.socket.emit('report');
};







//Recieves a new player from the server and adds it to the list on screen.
//Input: Player object {id, role, name, alive:boolean}
Client.socket.on('newplayer', function(data){
	totalPlayers++;
	document.getElementById("playerList").innerHTML += data.name;
});

//Get's a list of all connected players and hides the start screen from the connected user.
//Input: playerList Array
//		{id, role, name, alive:boolean}
Client.socket.on('allplayers', function(data, id){
	
	//This is a hack and you know it Mickeal
	if(typeof id != "undefined" ){
		myId = id;
	}
	totalPlayers = data.length;
	document.getElementById("playerList").innerHTML="";
	for(i = 0; i < data.length; i++){
		document.getElementById("playerList").innerHTML += data[i].name + "<br>";
	}
	document.getElementById("startScreen").style.display = "none";
});

//A function to notify the user that they cannot join a game in progress
Client.socket.on('gamealreadystarted', function(data){
	alert("Game has already started!");
	//Set up observer tools later.
});

//Edit the screen to show the live players and the night action table
//Notes: That tabletext line is so hacky is makes me uncomfortable
//Input: playerList Array
//		{id, role, name, alive:boolean}
Client.socket.on('sendnighttable', function(data){
	
	var tableText = "<table>";
	for(i = 0; i < totalPlayers; i++){
		if(data[i].alive){
			tableText += "<tr><td>" + data[i].name +  
			"</td><td><button onclick=\"Client.targetPlayer("+ myId + ","+ data[i].id + 
			")\">Target</button></td></tr>";
		} else if(data[i].alive){
			tableText += "<tr><td>" + data[i].name +  "</td><td>Alive</td></tr>";
		} else {
			tableText += "<tr><td>" + data[i].name +  "</td><td>DEAD</td></tr>";
		}
	}
	tableText += "</table>";
	document.getElementById("nightTable").innerHTML = tableText;
	document.getElementById("nightTable").style.display = "inline";
	document.getElementById("dayTable").style.display = "none";
});

//Edit the screen to show the live players and the day action table
//Notes: That tabletext line is so hacky is makes me uncomfortable
//Input: playerList Array
//		{id, role, name, alive:boolean}
Client.socket.on('senddaytable', function(data){
	currentTable = data;
	alreadyVotedFor = -1;
	document.getElementById("playerList").style.display = "none";
	var tableText = "<table>";
	for(i = 0; i < totalPlayers; i++){
		if(data[i].alive && data[myId].alive){
			tableText += "<tr><td>" + data[i].name +  
			"</td><td><button onclick=\"Client.voteAgainst("+ myId + ","+ data[i].id + 
			")\">Vote</button></td></tr>";
		} else if(data[i].alive){
			tableText += "<tr><td>" + data[i].name +  "</td><td>Alive</td></tr>";
		} else {
			tableText += "<tr><td>" + data[i].name +  "</td><td>DEAD</td></tr>";
		}
	}
	tableText += "</table>";
	document.getElementById("dayTable").innerHTML = tableText;
	document.getElementById("dayTable").style.display = "inline";
	document.getElementById("nightTable").style.display = "none";
});

Client.socket.on('messagebroadcast', function(message){
	document.getElementById("messageField").innerHTML += "<br>" + message;
});
