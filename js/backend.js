var Backend = {};
module.exports = Backend;
Backend.voteThreshhold = 0;
Backend.playerList = [];
Backend.dayCounter = 1;
Backend.nightTable = [[],[],[],[],[],[],[],[],[],[],[]];
Backend.lethalHouses = [];
Backend.report = "";
Backend.innoVotes = 0;
Backend.guiltyVotes = 0;
Backend.totalEvil = 0;
Backend.totalGood = 0;
Backend.victoryLine = "";

Backend.lowerAndCheckIfGameOver = function(victimId){
switch(Backend.playerList[victimId].alignment){
			case "evil":
				Backend.totalEvil--;
				if(Backend.totalEvil <= 0){
					Backend.gameRunning = false;
					Backend.victoryLine = "Town wins!";
				}
				break;
			case "good":
				Backend.totalGood--;
				if(Backend.totalGood <= 0){
					Backend.gameRunning = false;
					Backend.victorLine = "Werewolf wins!";
				}
				break;
		}
};

Backend.voteAgainst = function(voterId, victimId, increment){
	Backend.playerList[victimId].votesToHang += increment;
	if(Backend.playerList[victimId].votesToHang >= Backend.voteThreshhold){
		console.log(Backend.playerList[victimId].name + ' is now on trial.');
			return victimId;
	}
	return -1;
};

Backend.verdict = function(victimId){
	Backend.report = "";
	Backend.innoVotes = 0;
	Backend.guiltyVotes = 0;
	for(i = 0; i < Backend.playerList.length; i++){
		switch(Backend.playerList[i].vote){
			case 0:
				Backend.report += Backend.playerList[i] + " has abstained!\n";
				break;
			case -1:
				Backend.report += Backend.playerList[i] + " voted innocent!\n";
				Backend.innoVotes++;
				break;
			case 1:
				Backend.report += Backend.playerList[i] + " voted guilty!\n";
				Backend.guiltyVotes++;
				break;
		}
		Backend.playerList[i].vote = 0;
	}
	
	if(Backend.guiltyVotes > Backend.innoVotes){
		Backend.playerList[victimId].alive = false;
		Backend.lowerAndCheckIfGameOver(victimId);
		return (Backend.playerList[victimId].name + " was lynched after a vote of " + Backend.guiltyVotes + "  to " + Backend.innoVotes);
	} else {
		return (Backend.playerList[victimId].name + " was let off the hook after a vote of " + Backend.guiltyVotes + "  to " + Backend.innoVotes);
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
			player.alignment = "evil";
			Backend.totalEvil++;
			break;
		case "doctor":
			player.precedence = 7;
			player.alignment = "good";
			Backend.totalGood++;
			break;
		case "townie":
			player.precedence = 10;
			player.alignment = "good";
			Backend.totalGood++;
			break;
	}
}

Backend.report = function(){
	var reportText = "";
	
	//Process first wave of nightly events
	for(i = 0; i < Backend.nightTable.length; i++){
		Backend.nightTable[i].forEach(function(action){
			switch(Backend.playerList[action.aggroId].role){
				case "werewolf":
					if(action.aggroId == action.victimId){
						Backend.lethalHouses.push(action.aggroId);
						console.log(Backend.lethalHouses);
						break; //BACK PRACTICE BAD PRACTICE STOP IT MICKEAL THIS IS YOUR CONSCIENCE SPEAKING
					}
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
		//If someone visits the werewolf, they need to be marked as unquestionably dead.
		for(i = 0; i < Backend.nightTable.length; i++){
			Backend.nightTable[i].forEach(function(action){
				if(Backend.lethalHouses.includes(action.victimId) && action.victimId != action.aggroId){
					Backend.playerList[action.aggroId].alive = false;
					Backend.playerList[action.aggroId].deathTurn = Backend.dayCounter;
					Backend.playerList[action.aggroId].deathCause = 
						Backend.playerList[action.aggroId].name + " was killed by a werewolf!";
				}
			});
		}
		
	for(i = 0; i < Backend.playerList.length; i++){
		Backend.playerList[i].targetting = -1;
		if(Backend.playerList[i].deathTurn == Backend.dayCounter){
			reportText += Backend.playerList[i].deathCause + "\n";
			Backend.lowerAndCheckIfGameOver(i);
		}
	}
	Backend.lethalHouses = [];
	Backend.nightTable = [[],[],[],[],[],[],[],[],[],[],[]];
	return reportText;
};