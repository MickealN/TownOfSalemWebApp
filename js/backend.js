var Backend = {};
module.exports = Backend;
Backend.voteThreshhold = 0;
Backend.playerList = [];
Backend.dayCounter = 1;
Backend.nightTable = [[],[],[],[],[],[],[],[],[],[],[]];




Backend.voteAgainst = function(voterId, victimId, increment){
	Backend.playerList[victimId].votesToHang += increment;
	if(Backend.playerList[victimId].votesToHang >= Backend.voteThreshhold){
		console.log(Backend.playerList[victimId].name + ' is now on trial.');
			//TODO: Include code that puts the voted on trial
	}
};

Backend.targetPlayer = function(aggroId, victimId){
	//Don't try to understand this. It's write-only code. It fucking works. That's all you need to know
	var retVal = 0;
	if(Backend.playerList[aggroId].targetting == victimId ){
		Backend.playerList[aggroId].targetting = -1;	
		Backend.nightTable[Backend.playerList[aggroId].precedence].splice(
				Backend.nightTable[Backend.playerList[aggroId].precedence].findIndex(x => x.aggroId == aggroId), 1);
		retVal = 1;
	
	} else {
	
		if(Backend.playerList[aggroId].targetting != -1){
			//Removes the last target from the nightTable via action (which has 
			//yet to be changed)
			Backend.nightTable[Backend.playerList[aggroId].precedence].splice(
				Backend.nightTable[Backend.playerList[aggroId].precedence].findIndex(x => x.aggroId == aggroId), 1);
			retVal = 2;
		}
		//Writes a new action and puts it in the table to be processed at the end of the night.
		Backend.nightTable[Backend.playerList[aggroId].precedence].push(
			Backend.playerList[aggroId].action = {aggroId:aggroId, victimId:victimId} );
		Backend.playerList[aggroId].targetting = victimId;
	}
	//console.log(Backend.nightTable);
	return retVal;
};

Backend.setPrecedence = function(player){
	switch(player.role){
		case "werewolf":
			player.precedence = 2;
			break;
		case "doctor":
			player.precedence = 7;
			break;
		case "townie":
			player.precedence = 10;
			break;
	}
}

Backend.report = function(){
	var reportText = "";
	for(i = 0; i < Backend.nightTable.length; i++){
		Backend.nightTable[i].forEach(function(action){
			switch(Backend.playerList[action.aggroId].role){
				case "werewolf":
					Backend.playerList[action.victimId].alive = false;
					Backend.playerList[action.victimId].deathTurn = Backend.dayCounter;
					Backend.playerList[action.victimId].deathCause = 
						Backend.playerList[action.victimId].name + " was killed by a werewolf!";
					break;
				case "doctor":
					if(Backend.playerList[action.victimId].deathTurn == Backend.dayCounter){
						Backend.playerList[action.victimId].alive = true;
						Backend.playerList[action.victimId].deathCause += " But they were brought back by the doctor!";
					}
					break;
			}
		});
	}
	
	
	for(i = 0; i < Backend.playerList.length; i++){
		Backend.playerList[i].targetting = -1;
		if(Backend.playerList[i].deathTurn == Backend.dayCounter){
			reportText += Backend.playerList[i].deathCause + "\n";
		}
	}
	Backend.nightTable = [[],[],[],[],[],[],[],[],[],[],[]];
	return reportText;
};

