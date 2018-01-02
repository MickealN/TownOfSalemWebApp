var Backend = {};
module.exports = Backend;
Backend.voteThreshhold = 0;
Backend.playerList = [];
Backend.dayCounter = 0;
Backend.nightTable = [[],[],[],[],[],[],[],[],[],[],[]];
Backend.lethalHouses = [];
Backend.report = "";
Backend.innoVotes = 0;
Backend.guiltyVotes = 0;
Backend.totalMafia = 0;
Backend.totalWolves = 0;
Backend.totalGood = 0;
Backend.victoryLine = "";

//TODO: Need to make it so people can't vote guilty or innocent on their own trial

Backend.lowerAndCheckIfGameOver = function(victimId){
switch(Backend.playerList[victimId].alignment){
			case "mafia":
				Backend.totalMafia--;
				if(Backend.totalMafia <= 0){
					if(Backend.totalGood <= 0){
						Backend.gameRunning = false;
						Backend.victoryLine = "Werewolf wins!";
					} else if(Backend.totalWolves <= 0){
						Backend.gameRunning = false;
						Backend.victoryLine = "Town wins!";
					}
				}
				break;
				
			case "werewolf":
				Backend.totalWolves--;
				if(Backend.totalWolves <= 0){
					if(Backend.totalGood <= 0){
						Backend.gameRunning = false;
						Backend.victoryLine = "Mafia wins!";
					} else if(Backend.totalMafia <= 0){
						Backend.gameRunning = false;
						Backend.victoryLine = "Town wins!";
					}
				}
				break;
				
			case "good":
				Backend.totalGood--;
				if(Backend.totalGood <= 0){
					
					if(Backend.totalWolves <= 0){
						Backend.gameRunning = false;
						Backend.victoryLine = "Mafia wins!";
					} else if(Backend.totalMafia <= 0){
						Backend.gameRunning = false;
						Backend.victoryLine = "Werewolf wins!";
					}
				}
				break;
		}

	if(!Backend.gameRunning){
		console.log(Backend.victoryLine);
	}
};

//Returning an ID means that said person is up on trial, but -1 means nothing came of a vote.
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
		if(Backend.playerList[i].id != victimId){ //No voting on your own trial!
			switch(Backend.playerList[i].vote){	
				case 0:
					Backend.report += Backend.playerList[i].name + " has abstained!\n";
					break;
				case -1:
					Backend.report += Backend.playerList[i].name + " voted innocent!\n";
					Backend.innoVotes++;
					break;
				case 1:
					Backend.report += Backend.playerList[i].name + " voted guilty!\n";
					Backend.guiltyVotes++;
					break;
			}
		}	
			Backend.playerList[i].vote = 0;
	}
	
	if(Backend.guiltyVotes > Backend.innoVotes){
		Backend.playerList[victimId].alive = false;
		Backend.lowerAndCheckIfGameOver(victimId);
		Backend.report += (Backend.playerList[victimId].name + " was lynched after a vote of " + Backend.guiltyVotes + "  to " + Backend.innoVotes);
		return Backend.report;
	} else {
		Backend.report += (Backend.playerList[victimId].name + " was let off the hook after a vote of " + Backend.guiltyVotes + "  to " + Backend.innoVotes);
		return Backend.report;
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


Backend.fullMoon = function(){
	for(i = 0; i < Backend.playerList.length; i++){
		if(Backend.playerList[i].role == "werewolf"){
			if(Backend.dayCounter % 2 == 0){
				//Give the WW night action
				Backend.playerList[i].hasNightAction = true;
				Backend.playerList[i].attack = 3;
				Backend.playerList[i].armor = 3;
			} else {
				//Revoke the WW's night action
				Backend.playerList[i].hasNightAction = false;
				Backend.playerList[i].attack = 0;
				Backend.playerList[i].armor = 0;
			}
		}
	}
	
	return Backend.dayCounter % 2;
};

Backend.setRoleStats = function(player){
	switch(player.role){
		case "werewolf":
			player.precedence = 2;
			player.alignment = "werewolf";
			Backend.totalWolves++;
			player.hasNightAction = true;
			player.attack = 3;
			player.armor = 3;
			break;
		case "vigilante":
			player.precedence = 3;
			player.alignment = "good";
			Backend.totalGood++;
			player.hasNightAction = true;
			player.attack = 2;
			player.armor = 2;
			player.totalShots = 1;
			break;
		case "mafioso":
			player.precedence = 4;
			player.alignment = "mafia";
			Backend.totalMafia++;
			player.hasNightAction = true;
			player.attack = 3;
			player.armor = 1;
			break;
		case "doctor":
			player.precedence = 7;
			player.alignment = "good";
			Backend.totalGood++;
			player.hasNightAction = true;
			break;
		case "townie":
			player.precedence = 10;
			player.alignment = "good";
			Backend.totalGood++;
			player.hasNightAction = false;
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
					
					//This is if the werewolf stays home, it sets the house as a trap. Anyone who visits said house just dies.
					//Then is breaks the case and ignores the rest...........
					if(action.aggroId == action.victimId){
						Backend.lethalHouses.push(action.aggroId);
						console.log(Backend.lethalHouses);
						break; //BACK PRACTICE BAD PRACTICE STOP IT MICKEAL THIS IS YOUR CONSCIENCE SPEAKING
					}
					
					if(Backend.playerList[action.victimId].armor < Backend.playerList[action.aggroId].attack){
						Backend.playerList[action.victimId].alive = false;
						Backend.playerList[action.victimId].deathTurn = Backend.dayCounter;
						Backend.playerList[action.victimId].deathCause = Backend.playerList[action.victimId].name + " was killed by a werewolf!";
					} else {
						Backend.playerList[action.aggroId].personalMessage = Backend.playerList[action.victimId].name + " fought you off!\n";
						Backend.playerList[action.victimId].personalMessage = "You fought off a werewolf!\n";
					}
					break;
					
				case "vigilante":
					if(action.victimId == action.aggroId){ //Don't yourself. You will do it.
						break;
					}
					
					if(Backend.playerList[action.aggroId].totalShots > 0){
						Backend.playerList[action.aggroId].totalShots = Backend.playerList[action.aggroId].totalShots - 1;
						if(Backend.playerList[action.aggroId].totalShots == 0){
							Backend.playerList[action.aggroId].hasNightAction = false;
						}
					} else {
						break;
					}
					
					if(Backend.playerList[action.victimId].armor < Backend.playerList[action.aggroId].attack){
						Backend.playerList[action.victimId].alive = false;
						Backend.playerList[action.victimId].deathTurn = Backend.dayCounter;
						Backend.playerList[action.victimId].deathCause = Backend.playerList[action.victimId].name + " was killed by the vigilante!"
						if(Backend.playerList[action.victimId].alignment == "good"){
							Backend.playerList[action.aggroId].deathTurn = Backend.dayCounter+1;
							Backend.playerList[action.aggroId].deathCause = Backend.playerList[action.aggroId].name + " commited suicide out of guilt!" 
						}
					} else if(Backend.playerList[action.victimId].attack > Backend.playerList[action.aggroId].armor){
						Backend.playerList[action.aggroId].alive = false;
						Backend.playerList[action.aggroId].deathTurn = Backend.dayCounter;
						Backend.playerList[action.aggroId].deathCause = Backend.playerList[action.aggroId].name + " died while trying to exact vigilante justice!"
					}
					
					break;
					
					
				case "mafioso":
					
					if(action.victimId == action.aggroId){ //Don't yourself. You will do it.
						break;
					}
					if(Backend.playerList[action.victimId].armor < Backend.playerList[action.aggroId].attack){
						Backend.playerList[action.victimId].alive = false;
						Backend.playerList[action.victimId].deathTurn = Backend.dayCounter;
						Backend.playerList[action.victimId].deathCause = Backend.playerList[action.victimId].name + " was killed by the mafia!"
					} else if(Backend.playerList[action.victimId].attack > Backend.playerList[action.aggroId].armor){
						Backend.playerList[action.aggroId].alive = false;
						Backend.playerList[action.aggroId].deathTurn = Backend.dayCounter;
						Backend.playerList[action.aggroId].deathCause = Backend.playerList[action.aggroId].name + " died while trying to murder someone!"
					}
					break;
					
				case "doctor":
					if(Backend.playerList[action.victimId].deathTurn == Backend.dayCounter){
						Backend.playerList[action.victimId].alive = true;
						Backend.playerList[action.victimId].healed = true;
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
			if(Backend.playerList[i].alive == true){ //This is a case for the vig commiting suicide one turn later.
				if(Backend.playerList[i].healed){ //This is to display they were healed, then set it to false (otherwise would grant an immunity
					Backend.playerList[i].healed = false;
				} else { //The player was not healed, but were alive with a deathturn event, meaning they committed suicide
					Backend.playerList[i].alive = false;
					Backend.lowerAndCheckIfGameOver(i);
				}
			} else {
				Backend.lowerAndCheckIfGameOver(i);
			}
			reportText += Backend.playerList[i].deathCause + "\n";
			
		}
	}
	Backend.lethalHouses = [];
	Backend.nightTable = [[],[],[],[],[],[],[],[],[],[],[]];
	return reportText;
};