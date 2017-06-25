//App.js
//use for bug testing if need be
//console.log(GLOBAL_NPC_LIST[1].ghosts);
//server.js
//Start Db
//var db = require('mysql-native').createTCPClient("localhost", "2000");
var mysql = require("mysql");
var PF = require('pathfinding');
var connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'pass',
		database: 'crawler'
});

console.log("[Server]: Got here.....")
connection.connect(function(e) {
	if(!e) {
		console.log("[Server]: Successfully connected to the database!");
	}

});


var express = require('express');
var app = express();
var serv = require('http').Server(app);
var colors = require('colors/safe');

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log(colors.magenta("[Server]") + colors.white(": SERVER STARTED"));

//timing Variables
var dmInc = 1;

var dt = 0;
var now;
var gameTime = 0;
var startTime = Date.now();

var SOCKET_LIST = {};
var PLAYER_LIST = {};

var GLOBAL_NPC_LIST = {};
var GLOBAL_WORLD_LIST = {};

//1
var map_Piece1 = [
	[1,0,1,1,1,1,1,0,1],
	[1,0,1,0,0,0,1,0,1],
	[1,0,1,0,1,0,0,0,1],
	[0,0,0,0,1,0,1,0,0],
	[1,1,1,1,1,0,1,1,1],
	[1,0,0,0,1,0,0,0,1],
	[1,0,1,0,1,0,1,1,1],
	[0,0,0,0,0,0,0,0,0],
	[1,0,1,1,1,1,1,0,1]
];


var GLOBAL_SPELL_BOOK = {
	heal_basic: {
		name: "Basic Heal",
		sequence: "123"
	}
}

//objects
var Player = function(id){
	//Player Inventory Initialization.
	var inventory = {
		1: {
			itemName: "none",
			itemImg: "none"
		},
		2: {
			itemName: "none",
			itemImg: "none"
		},
		3: {
			itemName: "none",
			itemImg: "none"
		},
		4: {
			itemName: "none",
			itemImg: "none"
		},
		5: {
			itemName: "none",
			itemImg: "none"
		},
		6: {
			itemName: "none",
			itemImg: "none"
		},
		7: {
			itemName: "none",
			itemImg: "none"
		},
		8: {
			itemName: "none",
			itemImg: "none"
		},
		9: {
			itemName: "none",
			itemImg: "none"
		},
		10: {
			itemName: "none",
			itemImg: "none"
		},
		11: {
			itemName: "none",
			itemImg: "none"
		},
		12: {
			itemName: "none",
			itemImg: "none"
		},
		13: {
			itemName: "none",
			itemImg: "none"
		},
		14: {
			itemName: "none",
			itemImg: "none"
		},
		15: {
			itemName: "none",
			itemImg: "none"
		},
		16: {
			itemName: "none",
			itemImg: "none"
		},
		17: {
			itemName: "none",
			itemImg: "none"
		},
		18: {
			itemName: "none",
			itemImg: "none"
		},
		19: {
			itemName: "none",
			itemImg: "none"
		},
		20: {
			itemName: "none",
			itemImg: "none"
		}
	}

	var spellList = {
		//Associative array, ordered by elementaly / mystical type.

		//->Elemental<-//
		ignis: {

		},
		aqua: {

		},
		terra: {

		},
		aer: {
			1: {
				//Roaring Thunder
				name: "Rugiens Procella",
				spell_id: "roaring_thunder",
				manaCost: 100,
				cost: 1000,
				baseDamage: 20,
				discovery_rate: 0.01,
				gfxSrc: "client/img/gfx/abilities/roaring_thunder.png"
			},
			2: {
				name: "Pulvis Minuta",
				spell_id: "dust_mites",
				manaCost: 45,
				Cost: 450,
				baseDamage: 8,
				discovery_rate: 0.01,
				gfxSrc: "client/img/gfx/abilities/dust_mites.png"
			}
		},

		//->Other<-//
		tenebrae: {
			1: {
				//Soul Passage
				name: "Iter de Anima",
				spell_id: "soul_passage",
				manaCost: 15000,
				baseDamage: 0,
				discovery_rate: 0.0015,
				gfxSrc: "client/img/gfx/abilities/soul_passage.png"
			}
		},
		lux: {

		},
		other: {

		}


	};

	var self = {
		//Player Properties
		logged: false,
		health: 50,
		maxHealth: 50,
		mana: 25,
		size: 8,
		id: id,
		x: 48,
		y: 48,
		color: "#008000",
		speed: 5,
		pressingUp: false,
		pressingDown: false,
		pressingLeft: false,
		pressingRight: false,
		cantMove: false,
		ready: false,
		GAME_MAP: "none",
		worldId: id,
		castingSpell: false,
		spell: [],
		direction: "idle",
		animTick: 0,
		lastTickUpdate: 0,
		currentAction: "none",
		currentWeaponDamage: "2",
		inventory: inventory,
		spellList: spellList,
		selectedAbility: "none",
	};
	return self;
};

var Ghost = function(id, x, y, vx, vy){
	var self = {
		health: 750,
		maxHealth: 750,
		mana: 750,
		size: 8,
		id: id,
		x: x,
		y: y,
		color: "#f5fc2a",
		speed: 2.5,
		vx: vx,
		vy: vy,
		cantMove: false,
		ready: false,
		status: "idle",
		lastMove: 0,
		moveTime: 0,
		setMove: 0,
		direction: "none",
		availableDirections: [],
		animTick: 0,
		lastTickUpdate: 0
	};
	return self;
}

var Knight = function(id, x, y, vx, vy){
	var self = {
		health: 15,
		maxHealth: 15,
		mana: 0,
		maxMana: 0,
		size: 32,
		id: id,
		x: x,
		y: y,
		color: "#a55108",
		speed: 2.5,
		vx: vx,
		vy: vy,
		cantMove: false,
		ready: false,
		dead: false,
		status: "idle",
		lastMove: 0,
		moveTime: 0,
		setMove: 0,
		direction: "none",
		availableDirections: [],
		animTick: 0,
		lastTickUpdate: 0,
		sightRadius: 300,
		chaseRadius: 300,
		target: "none"
	};
	return self;
}

var Rat = function(id, x, y, vx, vy){
	var self = {
		health: 15,
		maxHealth: 15,
		mana: 0,
		maxMana: 0,
		size: 16,
		id: id,
		x: x,
		y: y,
		color: "#a55108",
		speed: 2.5,
		vx: vx,
		vy: vy,
		cantMove: false,
		ready: false,
		dead: false,
		status: "idle",
		lastMove: 0,
		moveTime: 0,
		setMove: 0,
		direction: "none",
		availableDirections: []
	};
	return self;
}


//spells
var SpellObject = function(id, x, y, vx, vy){
	var self = {
		components: [],
		id: id,
		x: x,
		y: y,
		vx: vx,
		vy: vy

	};
	return self;
}

var Melee = function(x, y, hbx, hby, w, h, type, dir) {
	var self = {
		x: x,
		y: y,
		hbx: hbx,
		hby: hby,
		w: w,
		h: h,
		animTick: 0,
		type: type,
		direction: dir,
		lastTickUpdate: 0
	};
	return self;
}

var Ability_Dust_Mites = function(x, y, tx, ty, vx, vy, speed, ownerId) {
	var self = {
		x: x,
		y: y,
		tx: tx,
		ty: ty,
		vx: vx,
		vy: vy,
		speed: speed,
		ownerId: ownerId,
		r: 16,
		animTick: 0,
		lastTickUpdate: 0,
		rotation: 0,
		w: 64,
		h: 64
	};
	return self;
}

var Ability_Soul_Passage = function(x, y, duration, type, ownerId, linkedId) {
	var self = {
		type: type,
		x: x,
		y: y,
		duration: duration,
		ownerId: ownerId,
		linkedId: linkedId,
		sigils: []
	};
	return self;
}

var io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket)
{
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	var player = new Player(socket.id);
	PLAYER_LIST[socket.id] = player;

	console.log(colors.magenta('[Server]:') + ' Player with Id ' + colors.yellow('"'+ socket.id + '"') + ' has ' + colors.green('connected'));

	socket.on('disconnect', function()
	{
		var player = PLAYER_LIST[socket.id];
		console.log(player.worldId);

		if(GLOBAL_WORLD_LIST[player.worldId]) {
			var array = GLOBAL_WORLD_LIST[player.worldId].roomData.playerlist;
			var search_term = player.id;

			for( var i=array.length-1; i>=0; i--) {
				if(array[i] === search_term) {
					array.splice(i,1);
					console.log(array + " DONE YE");
					break;
				}
			}
		}
		if(GLOBAL_WORLD_LIST[player.id] || GLOBAL_NPC_LIST[player.id]) {

			delete GLOBAL_WORLD_LIST[socket.id];
			delete GLOBAL_NPC_LIST[socket.id];
		}

		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
		refreshAllLobbies();
		console.log(colors.magenta('[Server]:') + ' Player with Id ' + colors.yellow('"'+ socket.id + '"') + '" has ' + colors.red('disconnected.'));
	});

	socket.emit('receivedConnect',{id: socket.id});

	socket.on('keyPress', function(data)
	{
		var player = PLAYER_LIST[socket.id];
		if(data.inputId == "up")
		{
			//if(checkPresses(player, "up")) { player.animTick = 0; }

			player.pressingUp = data.state;
			if(data.state) {
				player.direction = "up";
			} else {
				if(!checkPresses(player, "up")) {
					player.direction = "idle_up";
				}
				//player.animTick = 0;
			}
		}
		if(data.inputId == "down")
		{
			//if(checkPresses(player, "down")) { player.animTick = 0; }
			if(data.state) {
				player.direction = "down";
			} else {
				player.direction = 'idle_down';
				//player.animTick = 0;
			}
				player.pressingDown = data.state;
		}

		if(data.inputId == "right")
		{
			//if(checkPresses(player, "right")) { player.animTick = 0; }

			player.pressingRight = data.state;
			//player.animTick = 0;
			if(data.state) {
				player.direction = "right";
			} else {
				if(!checkPresses(player, "right")) {
					player.direction = "idle";
				}
				//player.animTick = 0;
			}
		}
		if(data.inputId == "left")
		{
			//if(checkPresses(player, "left")) { player.animTick = 0; }

				player.pressingLeft = data.state;
				if(data.state) {
					player.direction = "left";
				} else {
					if(!checkPresses(player, "left")) {
						player.direction = "idle_left";
					}
					//player.animTick = 0;
				}
		}
	});

	//ABILITY EVENTS//

	socket.on('abilityChange', function(data) {
		var player = PLAYER_LIST[socket.id];
		console.log("Changing to " + data.ability)
		player.selectedAbility = data.ability;
		if(data.ability == "none") {
			player.castingSpell = false;
		} else {
			player.castingSpell = true;
		}
	});
	socket.on('castSpell', function(data) {
		//console.log(data);
		var castingPlayer = PLAYER_LIST[socket.id];
		if(data.ability == "dust_mites") {
			var dx = (data.x - castingPlayer.x);
			var dy = (data.y - castingPlayer.y);
			var mag = Math.sqrt((dx*dx)+(dy*dy));
			var vx = (dx/mag) * 2;
			var vy = (dy/mag) * 2;
			var newDustMites = new Ability_Dust_Mites(castingPlayer.x-32, castingPlayer.y-32, data.x, data.y, vx, vy, 2, castingPlayer.id );
			GLOBAL_WORLD_LIST[castingPlayer.worldId].abilities.dust_mites.push(newDustMites);
			return;
		}
	});
	//END ABILITY EVENTS//

	socket.on('openSwitch', function(data) {
		var world = GLOBAL_WORLD_LIST[socket.id];
		world.open = data;
		console.log("World " + socket.id + " to " + data );
	});

	socket.on('playerReady', function(data) {
		PLAYER_LIST[socket.id].ready = true;
		PLAYER_LIST[socket.id].GAME_MAP = data.map;

		GLOBAL_WORLD_LIST[socket.id] = {
			roomData: {
				playerlist: [socket.id],
				status: "inGameSolo",
				roomLengthX: data.roomLengthX,
				roomLengthY: data.roomLengthY
			},
			map: data.map,
			attacks: [],
			abilities: {
				//aer
				dust_mites: [],
				roaring_thunder: [],
				//tenebrae
				soul_passage: []
			},
			open: false
		};
		// server is 1
		// also get array of ghosts


		GLOBAL_NPC_LIST[socket.id] = {
		ShopKeeper: {
				health: 2150,
				mana: 2000,
				size: 8,
				id: "ShopKeeper",
				color: "#42d9f4",
				speed: 2.5,
				vx: 0,
				vy: 0,
				cantMove: false,
				ready: false,
				status: "idle",
				lastMove: 0,
				moveTime: 0,
				setMove: 0,
				direction: "none",
				x: "undef",
				y: "undef",
				segement: []
			},
			ghosts: [],
			rats: [],
			knights: []

		};

		for (var i in GLOBAL_WORLD_LIST[socket.id].map){//whole map
			for (var j in GLOBAL_WORLD_LIST[socket.id].map[i]){//whole map
				GLOBAL_WORLD_LIST[socket.id].map[i][j]
				if (GLOBAL_WORLD_LIST[socket.id].map[i][j].type == "Knight"){
					var random = Math.floor(Math.random()*5) +1;
					for (var k = 0;k < random; k++){
						var world = GLOBAL_WORLD_LIST[socket.id];
						var setX = j * 18 * 32;
						var setY = i * 18 * 32;
						var randX = Math.floor(Math.random()*(18*32));
						var randY = Math.floor(Math.random()*(18*32));

						while(determineTileFromPx(setX + randX, setY + randY, socket.id) == 9) {
							var randX = Math.floor(Math.random()*(18*32));
							var randY = Math.floor(Math.random()*(18*32));
						}
						var randomX = setX + randX;
						var randomY = setY + randY;
						var randomId = Math.random();
						var newKnight = new Knight(randomId, randomX, randomY, 0, 0);
						GLOBAL_NPC_LIST[socket.id].knights.push(newKnight);
						console.log("Did this: " + k)
					}
				}
			}
		}
		spawnGhosts(socket.id, 15);
		spawnRats(socket.id, 100);
		socket.emit("startPos", {x: PLAYER_LIST[socket.id].x, y: PLAYER_LIST[socket.id].y});
	});

	socket.on("createdShopKeeper", function(data){
		GLOBAL_NPC_LIST[socket.id].ShopKeeper.x = data.x;
		GLOBAL_NPC_LIST[socket.id].ShopKeeper.y = data.y;
		GLOBAL_NPC_LIST[socket.id].ShopKeeper.segement = data.segment;

	});


	socket.on("playerspawn", function(data) {
		var player = PLAYER_LIST[socket.id];
		player.x = data.x;
		player.y = data.y;
	});


	//Login stuff
	socket.on('attemptLogin', function(data) {
		var attemptUsername = data.username;
		var attemptPassword = data.password;

		var player = PLAYER_LIST[data.id];
		console.log("Got submit: " + attemptUsername);
		var stmt = "SELECT * FROM logins WHERE username=? AND password=?";
		connection.query(stmt,[attemptUsername, attemptPassword],function(err, rows, fields) {
			if(!err) {
				if(rows.length > 0) {
					player.name = rows[0].username;
					console.log("successfulLogin");
					player.logged = true;

					socket.emit("successfulLogin", {});
				} else {
					console.log("No users found");
					socket.emit("noUsers", {});
				}
			} else {
				console.log("ERROR");
			}
		});

	});


	socket.on("refreshLobbyList", function(data) {
		refreshLobby(socket);

	});


	socket.on('joinWorld', function(data) {
		var player = PLAYER_LIST[data.id];
		if(player) {
			//Player Exists
			var oldWorld = GLOBAL_WORLD_LIST[player.worldId];
			if(oldWorld) {
				//Old World exists, filter self out.

				var array = oldWorld.roomData.playerlist;
				var search_term = data.id;

				for( var i=array.length-1; i>=0; i--) {
					if(array[i] === search_term) {
						array.splice(i,1);
						console.log(array + " DONE YE");
						break;
					}
				}


				console.log("Old World List: " + array);
				if(array.length == 0) {
					//Delete old world



					delete GLOBAL_WORLD_LIST[player.worldId];
					delete GLOBAL_NPC_LIST[player.worldId];

				}

				var newWorldId = data.worldId;
				player.worldId = newWorldId;
				console.log(player.worldId);
				console.log(GLOBAL_WORLD_LIST);
				var newWorld = GLOBAL_WORLD_LIST[player.worldId];
				if(newWorld) {
					newWorld.roomData.playerlist.push(data.id);
				} else {
					newWorld.roomData.playerlist = [data.id];
				}
				console.log("New World List: " + newWorld.roomData.playerlist);

			} else {
				console.log("FATAL ERROR: FAILED TO FIND OLD WORLD!");
			}
		}
		refreshAllLobbies();
	});


	socket.on('playerAttackMelee', function() {
		var player = PLAYER_LIST[socket.id];
		player.currentAction = "attacking";
		player.animTick = 0;
		createNewMeleeAttack(player);
		console.log("CLICK");
	});

});

function createNewMeleeAttack(player) {
	var world = GLOBAL_WORLD_LIST[player.worldId];
	if(world) {
		var direction = "right";
		var animX, animY;
		if(player.direction == "idle" || player.direction == "right") {
			//If facing right.
			direction = "right";
			animX = player.x -32 + 40;
			animY = player.y -32;
			var xLoc = player.x-32 + 40;
			var yLoc = player.y-32 + 10;
		}

		if(player.direction == "left" || player.direction == "idle_left") {
			direction = "left";
			animX = player.x -32 - 40;
			animY = player.y -32;
			var xLoc = player.x-32 - 40;
			var yLoc = player.y-32 + 10;
		}

		if(player.direction == "up" || player.direction == "idle_up") {
			direction = "up";
			animX = player.x -32;
			animY = player.y -32 - 40;
			var xLoc = player.x-32;
			var yLoc = player.y-32;
		}

		if(player.direction == "down" || player.direction == "idle_down") {
			direction = "down";
			animX = player.x -32;
			animY = player.y -32+40;
			var xLoc = player.x-32;
			var yLoc = player.y-32+40;
		}


		var w = 32;
		var h = 32;
		//Create img for attack

		var newAttackObj = new Melee(animX, animY, xLoc, yLoc, w, h, "default", direction);

		world.attacks.push(newAttackObj);
		//Create actual damage for attack
		checkHits(newAttackObj, player.worldId, player);
		//console.log("CHECKED");
	} else {
		console.log("Random fatal error.");
	}
}

function checkHits(object, worldId, player) {
	//rats
	var world_npcs = GLOBAL_NPC_LIST[worldId];
	for(var i in world_npcs.rats) {
		var rat = world_npcs.rats[i];
		if(boxCollides([rat.x-rat.size/2, rat.y-rat.size/2],[16, 16],[object.hbx, object.hby],[object.w, object.h])) {
			//Hit rat with attack.
			rat.health -= player.currentWeaponDamage;
			console.log(rat.health);
		} else {
		}
	}
	for(var i in world_npcs.knights) {
		var knight = world_npcs.knights[i];
		if(boxCollides([knight.x, knight.y],[knight.size, knight.size],[object.hbx, object.hby],[object.w, object.h])) {
			//Hit rat with attack.
			knight.health -= player.currentWeaponDamage;
			console.log(knight.health);
		}
	}
}

function checkPresses(player, exclusion) {

	if(exclusion == "up") {
		if(player.pressingDown || player.pressingLeft || player.pressingRight) {
			return true;
		}
	} else if(exclusion == "down" ) {
		if(player.pressingUp || player.pressingLeft || player.pressingRight) {
			return true;
		}
	} else if(exclusion == "left") {
		if(player.pressingUp || player.pressingDown || player.pressingRight) {
			return true;
		}
	} else if(exclusion == "right") {
		if(player.pressingUp || player.pressingDown || player.pressingLeft) {
			return true;
		}
	}


	if(player.pressingUp || player.pressingDown || player.pressingLeft || player.pressingRight) {
		return true;
	}
}

function refreshLobby(socket) {
	var lobby_pack = [];
	for(var i in GLOBAL_WORLD_LIST) {
		if(true) {
			var world = GLOBAL_WORLD_LIST[i];
			var worldAmount = world.roomData.playerlist.length;
			if(i !== socket.id) {
				lobby_pack.push({
						worldId: i,
						worldAmount: worldAmount
				});
			}
		}
	}
	socket.emit("refreshedLobbyInfo", lobby_pack);
}

function refreshAllLobbies() {
	var lobby_pack = [];
	for(var i in GLOBAL_WORLD_LIST) {
		if(true) {
			var world = GLOBAL_WORLD_LIST[i];
			var worldAmount = world.roomData.playerlist.length;

			lobby_pack.push({
					worldId: i,
					worldAmount: worldAmount
			});
		}
	}

	for(var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit("refreshedLobbyInfo", lobby_pack);
	}
}
//qhosts
function spawnGhosts(id, amount)
{
	//id, x, y, vx, vy
	// random XY coordinates for each ghost spawned e.g. 2 for loopS that wil generate
	var world = GLOBAL_NPC_LIST[id];
	for (var i = 0; i < amount ; i++){
		var randomX = Math.floor(Math.random()*1000);
		var randomY = Math.floor(Math.random()*1000);
		var randomId = Math.random();
		var newGhost = new Ghost(randomId, randomX, randomY, 0,0);
		world.ghosts.push(newGhost);
	}
}

function spawnRats(id, amount)
{
	//id, x, y, vx, vy
	// random XY coordinates for each ghost spawned e.g. 2 for loopS that wil generate
	var worldNpc = GLOBAL_NPC_LIST[id];
		for(var i = 0; i < amount ; i ++)
		{
			var world = GLOBAL_WORLD_LIST[id];
			var randomX = Math.floor(Math.random()*(world.roomData.roomLengthX*18*32));
			var randomY = Math.floor(Math.random()*(world.roomData.roomLengthY*18*32));

			while(determineTileFromPx(randomX, randomY, id) == 1) {
				randomX = Math.floor(Math.random()*(world.roomData.roomLengthX*18*32));
				randomY = Math.floor(Math.random()*(world.roomData.roomLengthY*18*32));
			}

			var randomId = Math.random();
			var newRat = new Rat(randomId, randomX, randomY, 0,0);
			worldNpc.rats.push(newRat);
	}
}

function determineTileFromPx(x, y, id) {
	/*
	var world = GLOBAL_WORLD_LIST[id];
	var testX = (x/18)/32;
	var testY = (y/18)/32;
	var xOuterIndex = Math.floor(testX);
	var yOuterIndex = Math.floor(testY);
	var nx = testX - xOuterIndex;
	var ny = testY - yOuterIndex;
	var xIndex = Math.floor((nx*32*18)/32);
	var yIndex = Math.floor((ny*32*18)/32);

	return world.map[yOuterIndex][xOuterIndex].segment[yIndex][xIndex];
	*/
}

function updateAttacks(id) {
	for(var i in GLOBAL_WORLD_LIST[id].attacks) {
		var attack = GLOBAL_WORLD_LIST[id].attacks[i];
		if(attack) {
			var timer = 0.05;
			if(timer < dt - attack.lastTickUpdate) {
				attack.lastTickUpdate = dt;
				attack.animTick += 1;
				if(attack.animTick > 5) {
					GLOBAL_WORLD_LIST[id].attacks.splice(i, 1);
				}
			}
		}
	}
}


function updateRats(id) {
	for(var i in GLOBAL_NPC_LIST[id].rats) {
		var rat = GLOBAL_NPC_LIST[id].rats[i];
			if(!rat.dead) {
				if(rat.status == "idle") {
					//Set ghost to idling for a random amount of time.
					rat.status = "idling";
					var random = Math.floor(Math.random()*5);
					rat.moveTime = random;
					rat.setMove = dt;
				}

				if(rat.status == "idling") {
					if(rat.moveTime < (dt-rat.setMove)) {
						//Ghost has surpassed wait time for next Movement
						//Must decide on new pathing.
						var direction = determineAvailableDirections(rat, id);
						//var direction = ["up", "down", "left", "right"];
						var randomDirection = Math.ceil(Math.random()*direction.length) - 1;
						var randomTime = Math.random()*4;

						if(direction[randomDirection] == "up") {
							//Go up
							rat.vx = 0;
							rat.vy = -1;
							rat.status = "moving";
							rat.direction = "up";
						} else if(direction[randomDirection] == "down") {
							//Go down
							rat.vx = 0;
							rat.vy = 1;
							rat.status = "moving";
							rat.direction = "down";
						} else if(direction[randomDirection] == "right") {
							//Go right
							rat.vx = 1;
							rat.vy = 0;
							rat.status = "moving";
							rat.direction = "right";
						} else if(direction[randomDirection] == "left") {
							//Go left
							rat.vx = -1;
							rat.vy = 0;
							rat.status = "moving";
							rat.direction = "left";
						}
						rat.moveTime = randomTime;
						rat.setMove = dt;
					}
				}

				if(rat.status == "moving") {
					var left = 2;
					var right = 3;
					var up = 0;
					var down = 1;
					var tempTile = determineAdjacentTiles(rat, id);
					if(tempTile[rat.direction] !== 9){
						rat.direction = "none";
						rat.status = "idle";
					}




					if(rat.moveTime > (dt-rat.setMove)) {
						//Ghost has surpassed alloted movement time.
						rat.x += rat.vx * rat.speed;
						rat.y += rat.vy * rat.speed;




						//FINAL CHECK, ANY OTHER UPDATES MUST GO ABOVE.

						if(rat.x < 32 || rat.x + rat.size > (GLOBAL_WORLD_LIST[id].roomData.roomLengthX*18*32)-32-rat.size || rat.y < 32+rat.size || rat.y > (GLOBAL_WORLD_LIST[id].roomData.roomLengthY*18*32)-32-rat.size ) {
							rat.x -= rat.vx * rat.speed;
							rat.y -= rat.vy * rat.speed;
							rat.status = "idle";
						}

					} else {
						rat.status = "idle";
					}
				}
			}

			if(rat.health <= 0) {
				console.log("HERE");
				rat.health = 0;
				rat.dead = true;
			}
	}
}


function updateGhosts(id) {
	for(var i in GLOBAL_NPC_LIST[id].ghosts) {
		var ghost = GLOBAL_NPC_LIST[id].ghosts[i];
			var timer = 0.05;

			if(ghost.status == "idling") { timer = 0.05; }

			if(timer < dt - ghost.lastTickUpdate) {
				ghost.lastTickUpdate = dt;
				ghost.animTick += 1;
				if(ghost.animTick > 8) {
					ghost.animTick = 0;
				}
			}

			if(ghost.status == "idle") {
				//Set ghost to idling for a random amount of time.
				ghost.status = "idling";
				var random = Math.floor(Math.random()*5);
				ghost.moveTime = random;
				ghost.setMove = dt;
			}

			if(ghost.status == "idling") {
				if(ghost.moveTime < (dt-ghost.setMove)) {
					//Ghost has surpassed wait time for next Movement
					//Must decide on new pathing.
					var randomDirection = Math.ceil(Math.random()*4);
					var randomTime = Math.random()*4;
					if(randomDirection == 1) {
						//Go up
						ghost.vx = 0;
						ghost.vy = -1;
						ghost.status = "moving";
						ghost.direction = "up";
					} else if(randomDirection == 2) {
						//Go down
						ghost.vx = 0;
						ghost.vy = 1;
						ghost.status = "moving";
						ghost.direction = "down";
					} else if(randomDirection == 3) {
						//Go right
						ghost.vx = 1;
						ghost.vy = 0;
						ghost.status = "moving";
						ghost.direction = "right";
					} else if(randomDirection == 4) {
						//Go left
						ghost.vx = -1;
						ghost.vy = 0;
						ghost.status = "moving";
						ghost.direction = "left";
					}
					ghost.moveTime = randomTime;
					ghost.setMove = dt;
				}
			}

			if(ghost.status == "moving") {
				if(ghost.moveTime > (dt-ghost.setMove)) {
					//Ghost has surpassed alloted movement time.
					ghost.x += ghost.vx * ghost.speed;
					ghost.y += ghost.vy * ghost.speed;




					//FINAL CHECK, ANY OTHER UPDATES MUST GO ABOVE.

					if(ghost.x < 32 || ghost.x + ghost.size > (GLOBAL_WORLD_LIST[id].roomData.roomLengthX*18*32)-32-ghost.size || ghost.y < 32+ghost.size || ghost.y > (GLOBAL_WORLD_LIST[id].roomData.roomLengthY*18*32)-32-ghost.size ) {
						ghost.x -= ghost.vx * ghost.speed;
						ghost.y -= ghost.vy * ghost.speed;
						ghost.status = "idle";
					}

				} else {
					ghost.status = "idle";
				}
			}

	}
}

function updateKnights(id) {
	var npcList = GLOBAL_NPC_LIST[id];
	for(var i in npcList.knights) {
		var knight = npcList.knights[i];
		var timer = 0.15;

		if(timer < dt - knight.lastTickUpdate) {
			knight.lastTickUpdate = dt;
			knight.animTick += 1;
			if(knight.animTick > 2) {
				knight.animTick = 0;
			}
		}

		if(!knight.dead) {
			if(knight.status == "idle") {
				//Set ghost to idling for a random amount of time.
				knight.status = "idling";
				var random = Math.floor(Math.random()*5);
				knight.moveTime = random;
				knight.setMove = dt;
			}

			if(knight.status == "idling") {
				checkNearbyPlayers(knight, id);
				if(knight.moveTime < (dt-knight.setMove)) {
					//Ghost has surpassed wait time for next Movement
					//Must decide on new pathing.
					var direction = determineAvailableDirections(knight, id);
					//var direction = ["up", "down", "left", "right"];
					var randomDirection = Math.ceil(Math.random()*direction.length) - 1;
					var randomTime = Math.random()*4;

					if(direction[randomDirection] == "up") {
						//Go up
						knight.vx = 0;
						knight.vy = -1;
						knight.status = "moving";
						knight.direction = "up";
					} else if(direction[randomDirection] == "down") {
						//Go down
						knight.vx = 0;
						knight.vy = 1;
						knight.status = "moving";
						knight.direction = "down";
					} else if(direction[randomDirection] == "right") {
						//Go right
						knight.vx = 1;
						knight.vy = 0;
						knight.status = "moving";
						knight.direction = "right";
					} else if(direction[randomDirection] == "left") {
						//Go left
						knight.vx = -1;
						knight.vy = 0;
						knight.status = "moving";
						knight.direction = "left";
					}
					knight.moveTime = randomTime;
					knight.setMove = dt;
				}
			}

			if(knight.status == "moving") {
				checkNearbyPlayers(knight, id);
				var left = 2;
				var right = 3;
				var up = 0;
				var down = 1;
				var tempTile = determineAdjacentTiles(knight, id);
				if(tempTile[knight.direction] !== 9){
					knight.direction = lastIdle(knight);
					knight.status = "idle";
				}




				if(knight.moveTime > (dt-knight.setMove)) {
					//Ghost has surpassed alloted movement time.
					knight.x += knight.vx * knight.speed;
					knight.y += knight.vy *knight.speed;




					//FINAL CHECK, ANY OTHER UPDATES MUST GO ABOVE.

					if(knight.x < 32 || knight.x + knight.size > (GLOBAL_WORLD_LIST[id].roomData.roomLengthX*18*32)-32-knight.size || knight.y < 32+knight.size || knight.y > (GLOBAL_WORLD_LIST[id].roomData.roomLengthY*18*32)-32-knight.size ) {
						knight.x -= knight.vx * knight.speed;
						knight.y -= knight.vy * knight.speed;
						knight.direction = lastIdle(knight);
						knight.status = "idle";
					}

				} else {
					knight.status = "idle";
					knight.direction = lastIdle(knight);
				}
			}

			if(knight.status == "choose_chase") {
				var outerIndex = findOuterIndex(knight, id);
				var knightSegment = GLOBAL_WORLD_LIST[id].map[outerIndex.outerY][outerIndex.outerX].segment;
				var walkabilityMatrix = knightSegment;
				//console.log(knightSegment);
				var grid = new PF.Grid(18,18);
				for(var k in knightSegment) {
					for(var l in knightSegment[k]) {
						var tile = knightSegment[k][l];
						if(tile == 09) {
							grid.setWalkableAt(l,k,true);
						} else {
							grid.setWalkableAt(l,k,false);
						}
					}
				}
				var playerLoc = findInnerIndex(PLAYER_LIST[knight.target], id);
				var knightLoc = findInnerIndex(knight, id);
				var finder = new PF.AStarFinder({
					allowDiagonal: PF.DiagonalMovement.OnlyWhenNoObstacles
				});
				var path = finder.findPath(knightLoc.innerX, knightLoc.innerY, playerLoc.innerX, playerLoc.innerY, grid);
				//console.log(path);
				knight.currentPath = path;
				if(knight.currentPath.length !==0 ){
					knight.status = "chasing";
					//console.log(knight.currentPath);
					//console.log("It exists, get better js: " + knight.currentPath[1]);
					if(knight.currentPath.length <= 1) { knight.status = "attacking"; return; }
					var vectors = newVectorFromPathway(knight.currentPath[1][0], knight.currentPath[1][1], knightLoc.innerX, knightLoc.innerY);
					//knight.direction = getDirectionFromVelocity(vectors.vx, vectors.vy);
					if(vectors.vx > 1) { vectors.vx = 1; }
					if(vectors.vy > 1) { vectors.vy = 1;}
					if(vectors.vx < -1) { vectors.vx = -1; }
					if(vectors.vy < -1) { vectors.vy = -1;}
					knight.vx = vectors.vx * knight.speed;
					knight.vy = vectors.vy * knight.speed;
					knight.direction = getDirectionFromVelocity(knight.vx/knight.speed, knight.vy/knight.speed);

				}

			}


			if(knight.status == "chasing") {
				//Chasing in given direction.
				var target = PLAYER_LIST[knight.target];
				var targetLoc = [target.x, target.y];
				var targetHb = [target.size, target.size];
				var knightLocOther = [knight.x - knight.chaseRadius/2, knight.y - knight.chaseRadius/2];
				var knightChaseHb = [knight.chaseRadius, knight.chaseRadius];

				var knightLoc = findInnerIndex(knight, id);
				var playerLoc = findInnerIndex(target, id);
				if(boxCollides(targetLoc, targetHb, knightLocOther, knightChaseHb)) {
					if(playerLoc.innerX !== knight.currentPath[knight.currentPath.length-1][0] || playerLoc.innerY !== knight.currentPath[knight.currentPath.length-1][1]) {
						knight.status = "choose_chase";
					}
					//console.log("Current Location: " + knightLoc.innerX + "," + knightLoc.innerY);
					//console.log("Pler Location: " + PLAYER_LIST[knight.target]);
					//console.log("To Get to: " + knight.currentPath[1][0]);
					//console.log(knight.currentPath);
					if(knight.currentPath.length == 0) { knight.status = "idle"; }
					if(knightLoc.innerX !== knight.currentPath[1][0] || knightLoc.innerY !== knight.currentPath[1][1]) {
						//console.log(knight.vx, knight.vy);
						knight.x -= knight.vx;
						knight.y -= knight.vy;
						//console.log(knight.currentPath);
					} else {
						//Assign new Path vector
						if(knight.currentPath.length) {
							knight.currentPath.splice(0,1);
							var nextPosX;
							var nextPosY;
							var run = false;
							for(var a in knight.currentPath) {
								if(knight.currentPath[a][0] !== knightLoc.innerX && knightLoc.innerY !== knight.currentPath[a][1]) {
									run = true;
									nextPosX = knight.currentPath[a][0];
									nextPosY = knight.currentPath[a][1];
									break;
								}
							}
							if(run == false) {
								knight.status = "attacking";
							}

							if(nextPosX && nextPosY){
								var vectors = newVectorFromPathway(nextPosX, nextPosY, knightLoc.innerX, knightLoc.innerY);
								//knight.direction = getDirectionFromVelocity(vectors.vx, vectors.vy);
								//console.log(knight.direction);
								if(vectors.vx > 1) { vectors.vx = 1; }
								if(vectors.vy > 1) { vectors.vy = 1;}
								if(vectors.vx < -1) { vectors.vx = -1; }
								if(vectors.vy < -1) { vectors.vy = -1;}
								knight.vx = vectors.vx * knight.speed;
								knight.vy = vectors.vy * knight.speed;
								knight.direction = getDirectionFromVelocity(knight.vx/knight.speed, knight.vy/knight.speed);

							}

						} else {
							knight.status = "attacking";
						}
					}
				} else {
					knight.status = "idle";
				}
			}

			if(knight.status == "attacking") {
				var knightLoc = findInnerIndex(knight,id);
				var playerLoc = findInnerIndex(PLAYER_LIST[knight.target], id);
				//console.log("Knight is attacking!");
				if(knightLoc.innerX !== playerLoc.innerX || playerLoc.innerY !== knightLoc.innerY ) {
					knight.status = "choose_chase";
				}
			}
			if(knight.health <= 0) {
				//console.log("HERE");
				knight.health = 0;
				knight.dead = true;
			}
		}
	}
}
function getDirectionFromVelocity(vx,vy) {
	console.log(vx, vy);
	if(vx == 0) {
		if(vy == -1) {
			return "down";
		} else if (vy == 1) {
			return "up";
		}
	} else if(vy == 0) {
		if(vx == 1) {
			return "left";
		} else if(vx == -1) {
			return "right";
		}
	}

	if(vx == 1) {
		if(vy == -1) {
			return "right";
		}
	}

	if(vx > 0 && vy > 0) { return "up"; }
	if(vx < 0 && vy > 0) { return "up"; }
	if(vx < 0 && vy < 0) { return "down"; }
	if(vx > 0 && vy < 0) { return "down"; }

	return "down";

}
function newVectorFromPathway(posX, posY, curX, curY) {
	var newVx = curX - posX;
	var newVy = curY - posY;
	return {vx: newVx, vy: newVy};
}

function lastIdle(entity) {
	if(entity.direction == "right") {
		return "idle_right";
	} else if(entity.direction == "left") {
		return "idle_left";
	} else if(entity.direction == "down") {
		return "none";
	} else if(entity.direction == "up") {
		return "idle_up";
	}
}
function checkNearbyPlayers(entity, id) {
	var world = GLOBAL_WORLD_LIST[id];
	for(var i in world.roomData.playerlist) {
		var player = PLAYER_LIST[world.roomData.playerlist[i]];
		var plyrLoc = [player.x, player.y];
		var plyrHb = [64,64];
		var entityLoc = [entity.x-entity.sightRadius/2,entity.y-entity.sightRadius/2];
		var entitySightHb = [entity.sightRadius,entity.sightRadius];
		if(boxCollides(plyrLoc, plyrHb, entityLoc, entitySightHb)) {
			entity.target = player.id;
			entity.status = "choose_chase";
		}
	}
}
function decideChaseDirection(entity, target) {
//console.log(entity.x, entity.y, target.x, target.y);
	var dx = (target.x - entity.x);
	var dy = (target.y - entity.y);
	var mag = Math.sqrt((dx*dx)+(dy*dy));
	var vx = (dx/mag);
	var vy = (dy/mag);
	var unitVector = {x: vx, y: vy};
//console.log("Unit X: " + unitVector.x + "Unit Y: " + unitVector.y);
	if(unitVector.x < 0) {
		if(unitVector.y < 0) {
			//Top Left
			return "top_left";
		} else if(unitVector.y > 0) {
			//Bottom Left
			return "bottom_left";
		}
	} else if(unitVector.x > 0) {
		if(unitVector.y < 0) {
			//Top Right
			return "top_right";
		} else if(unitVector.y > 0) {
			//Bottom right
			return "bottom_right";
		}
	}

	if(unitVector.x == 0) {

		if(unitVector.y == 1) {
			return "down";
		} else if(unitVector.y == -1) {
			return "up";
		}
	}

	if(unitVector.y == 0) {
		if(unitVector.x == 1) {
			return "right";
		} else if(unitVector.x == -1) {
			return "left";
		} else if(unitVector.x == 0) {
			return "down";
		}
	}
	if(unitVector.x == 1 && unitVector.y == 1) { return "bottom_right"; }
	if(unitVector.x == -1 && unitVector.y == -1) { return "top_left"; }
	if(unitVector.x == 1 && unitVector.y == -1) { return "top_right"; }
	if(unitVector.x == -1 && unitVector.y == 1) { return "bottom_left"; }
}

//ABILITY UPDATES

function updateDustMites(i) {
	var world = GLOBAL_WORLD_LIST[i];



	for(var j in world.abilities) {
		for(var k in world.abilities[j]) {
			var dustMite = world.abilities[j][k];
			var testX = (dustMite.x/18)/32;
			var testY = (dustMite.y/18)/32;
			var xOuterIndex = Math.floor(testX);
			var yOuterIndex = Math.floor(testY);

			var timer = 0.15;

			if(timer < dt - dustMite.lastTickUpdate) {
				dustMite.lastTickUpdate = dt;

				if(dustMite.animTick == 6) {
					dmInc = -1;
				} else if(dustMite.animTick == 0) {
					dmInc = 1
				}

				dustMite.animTick += dmInc;
			}

			dustMite.rotation += 0.1;
			dustMite.x += dustMite.vx;
			dustMite.y += dustMite.vy;
			//console.log(dustMite);

			if(boxCollides([dustMite.x+(dustMite.w/2)-10, dustMite.y+(dustMite.h/2)-10],[10,10],[dustMite.tx-10, dustMite.ty-10], [10,10])) {
				world.abilities[j].splice(k, 1);
			}

			for(var v in world.map) {
				for(var b in world.map[v]) {
					var segment = world.map[v][b].segment;
						for(var n in segment) {
							for(var m in segment[n]) {
								if(segment[n][m] !== 09) {
									var posX = (b*(18*32)) + m*32;
									var posY = (v*(18*32)) + n*32;
									if(boxCollides([posX, posY],[32,32],[dustMite.x+5,dustMite.y+5], [dustMite.w-10, dustMite.h-10])) {
										world.abilities[j].splice(k,1);
										console.log("HIT!")
									}
								}
							}
						}
				}
			}
		}
	}
}



//END ABILITY UPDATES
function findOuterIndex(entity, id) {
	//var world = GLOBAL_WORLD_LIST[id];
	var testX = (entity.x/18)/32;
	var testY = (entity.y/18)/32;
	var xOuterIndex = Math.floor(testX);
	var yOuterIndex = Math.floor(testY);
	return {outerX: xOuterIndex, outerY: yOuterIndex};
}

function findInnerIndex(entity, id) {
	var testX = (entity.x/18)/32;
	var testY = (entity.y/18)/32;
	var xOuterIndex = Math.floor(testX);
	var yOuterIndex = Math.floor(testY);
	var newOffsetx = Math.floor((testX - xOuterIndex) * 18);
	var newOffsety = Math.floor((testY - yOuterIndex) * 18);

	return {innerX: newOffsetx, innerY: newOffsety};
}

function updatePosition(player)
{
	var timer = 0;
	if(player.direction == "idle" || player.direction == "idle_left"){ timer = 0.5; }
	if(player.direction == "right" || player.direction == "left") { timer = 0.1; }
	if(player.direction == "up" || player.direction == "down") { timer = 0.20; }
	if(player.direction == "idle_up" || player.direction == "idle_down") { timer = 1; }
	if(player.currentAction == "attacking") { timer = 0.1	; }

	if(timer < dt-player.lastTickUpdate) {
		player.lastTickUpdate = dt;
		if(player.direction == "idle" || player.direction == "idle_left") {
			player.animTick += 1;
			if(player.currentAction == "attacking") {
				if(player.animTick > 2) {
					player.animTick = 0;
					player.currentAction = "none";
				}
			} else {
				if(player.animTick > 2) {
					player.animTick = 0;
				}
			}

		}
		if(player.direction == "right" || player.direction == "left") {
			player.animTick += 1;
			if(player.currentAction == "attacking") {
				if(player.animTick > 2) {
					player.animTick = 0;
					player.currentAction = "none";
				}
			} else {
				if(player.animTick > 5) {
					player.animTick = 0;
				}
			}
		}
		if(player.direction == "down" || player.direction == "up") {
			player.animTick += 1;
			if(player.currentAction == "attacking") {
				if(player.animTick > 2) {
					player.animTick = 0;
					player.currentAction = "none";
				}
			} else {
				if(player.animTick > 3) {
					player.animTick = 0;
				}
			}
		}

	}

	var prevX = player.x;
	var prevY = player.y;
	if(player.cantMove == false) {
			if(player.pressingUp)
			{
				player.y -= player.speed;
			}
			if(player.pressingDown)
			{
				player.y += player.speed;
			}
			if(player.pressingRight)
			{
				player.x += player.speed;
			}
			if(player.pressingLeft)
			{
				player.x -= player.speed;
			}

		}

		player.cantMove = false;

		return [prevX, prevY];
}

function checkCollisions(player) {
	var world = GLOBAL_WORLD_LIST[player.worldId];
	//determineTile(player);
	if(player.ready) {
		for(var i in world.map) {
			for(var j in world.map[i]) {
				for(var k in world.map[i][j].segment) {
					for(var l in world.map[i][j].segment[k]) {
						var tile = world.map[i][j].segment[k][l];

						if(tile !== 9) {

							if(boxCollides([player.x-player.size+5, player.y-player.size+5],[player.size*2-10,player.size*2-10],[(j*32*18) + (l*32),(i*32*18) + (k*32)],[32,32])){
								var val1 = (i*32*18) + (l*32);
								var val2 = (j*32*18) + (k*32);
								if(player.pressingUp) {
									player.y += player.speed;
								}
								if(player.pressingDown) {
									player.y -= player.speed;
								}
								if(player.pressingRight) {
									player.x -= player.speed;
								}
								if(player.pressingLeft) {
									player.x += player.speed;
								}
							}
						}
					}
				}
			}
		}
	}
}

function determineAdjacentTiles(npc, id){
		var adjacentTiles = {
			up: "none",
			down: "none",
			left: "none",
			right: "none"
		};

		var world = GLOBAL_WORLD_LIST[id];
		var testX = (npc.x/18)/32;
		var testY = (npc.y/18)/32;
		var xOuterIndex = Math.floor(testX);
		var yOuterIndex = Math.floor(testY);
		var nx = testX - xOuterIndex;
		var ny = testY - yOuterIndex;
		var xIndex = Math.floor((nx*32*18)/32);
		var yIndex = Math.floor((ny*32*18)/32);

		//INIT NORM VALUES
		var testRightInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};
		var testLeftInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};
		var testUpInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};
		var testDownInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};

		//Change variables to suit the direction to be tested
		if(testRightInfo.x == 17) {
			if(testRightInfo.ox !== world.roomData.roomLengthX-1) {
				//Reached far right of segment.
				testRightInfo.x = 0;
				testRightInfo.ox += 1;
			} else {
				//Last segment on right.
				testRightInfo.toTest = false;
			}
		} else {
			//Within normal bounds for segment.
			testRightInfo.x += 1;
		}


		if(testLeftInfo.x == 0) {
			if(testLeftInfo.ox !== 0) {
				testLeftInfo.x = 17;
				testLeftInfo.ox -= 1;
			} else {
				testLeftInfo.toTest = false;
			}
		} else {
			//Within normal bounds for segment.
			testLeftInfo.x -= 1;
		}
		/////////////////////////////////

		if(testUpInfo.y == 0) {
			if(testUpInfo.oy !== 0) {
				testUpInfo.y = 17;
				testUpInfo.oy -= 1;
			}
		} else {
			//Within normal bounds for segment.
			testUpInfo.y -= 1;
		}

		/////////////////////////////////
		if(testDownInfo.y == 17) {
			if(testDownInfo.oy !== world.roomData.roomLengthY-1) {
				testDownInfo.y = 0;
				testDownInfo.oy += 1;
		  } else {
				testDownInfo.toTest = false;
			}
		} else {
			//Within normal bounds for segment.
			testDownInfo.y += 1;
		}

		//TEST TILES FOR THEIR number
		//////////////////////////////


		//Test right
		var tileRight = world.map[testRightInfo.oy][testRightInfo.ox].segment[testRightInfo.y][testRightInfo.x];


		var tileLeft = world.map[testLeftInfo.oy][testLeftInfo.ox].segment[testLeftInfo.y][testLeftInfo.x];


		var tileUp = world.map[testUpInfo.oy][testUpInfo.ox].segment[testUpInfo.y][testUpInfo.x];



		var tileDown = world.map[testDownInfo.oy][testDownInfo.ox].segment[testDownInfo.y][testDownInfo.x];
		////////////////////////////////////////
		adjacentTiles.up = tileUp;
		adjacentTiles.down = tileDown;
		adjacentTiles.left = tileLeft;
		adjacentTiles.right = tileRight;



		return adjacentTiles;

}

function determineAvailableDirections(npc, id) {

	var availableDirections = [];

	var world = GLOBAL_WORLD_LIST[id];
	var testX = (npc.x/18)/32;
	var testY = (npc.y/18)/32;
	var xOuterIndex = Math.floor(testX);
	var yOuterIndex = Math.floor(testY);
	var nx = testX - xOuterIndex;
	var ny = testY - yOuterIndex;
	var xIndex = Math.floor((nx*32*18)/32);
	var yIndex = Math.floor((ny*32*18)/32);


	//INIT NORM VALUES
	var testRightInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};
	var testLeftInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};
	var testUpInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};
	var testDownInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};

	//Change variables to suit the direction to be tested
	if(testRightInfo.x == 17) {
		if(testRightInfo.ox !== world.roomData.roomLengthX-1) {
			//Reached far right of segment.
			testRightInfo.x = 0;
			testRightInfo.ox += 1;
		} else {
			//Last segment on right.
			testRightInfo.toTest = false;
		}
	} else {
		//Within normal bounds for segment.
		testRightInfo.x += 1;
	}


	if(testLeftInfo.x == 0) {
		if(testLeftInfo.ox !== 0) {
			testLeftInfo.x = 17;
			testLeftInfo.ox -= 1;
		} else {
			testLeftInfo.toTest = false;
		}
	} else {
		//Within normal bounds for segment.
		testLeftInfo.x -= 1;
	}
	/////////////////////////////////

	if(testUpInfo.y == 0) {
		if(testUpInfo.oy !== 0) {
			testUpInfo.y = 17;
			testUpInfo.oy -= 1;
		}
	} else {
		//Within normal bounds for segment.
		testUpInfo.y -= 1;
	}

	/////////////////////////////////
	if(testDownInfo.y == 17) {
		if(testDownInfo.oy !== world.roomData.roomLengthY-1) {
			testDownInfo.y = 0;
			testDownInfo.oy += 1;
	  } else {
			testDownInfo.toTest = false;
		}
	} else {
		//Within normal bounds for segment.
		testDownInfo.y += 1;
	}
	/////////////////////////////////
	/*
	console.log("RIGHT INFO: " + testRightInfo.oy + ", " + testRightInfo.ox + ", " + testRightInfo.y + ", " + testRightInfo.x);
	console.log("LEFT INFO: " + testLeftInfo.oy + ", " + testLeftInfo.ox + ", " + testLeftInfo.y + ", " + testLeftInfo.x);
	console.log("UP INFO: " + testUpInfo.oy + ", " + testUpInfo.ox + ", " + testUpInfo.y + ", " + testUpInfo.x);
	console.log("DOWN INFO: " + testDownInfo.oy + ", " + testDownInfo.ox + ", " + testDownInfo.y + ", " + testDownInfo.x);
*/
	//TEST TILES FOR THEIR number
	//////////////////////////////
	//Test right
	if(testRightInfo.toTest) {
		var tileRight = world.map[testRightInfo.oy][testRightInfo.ox].segment[testRightInfo.y][testRightInfo.x];
		if(tileRight == 9) {
			availableDirections.push("right");
		}
	}
	if(testLeftInfo.toTest) {
		var tileLeft = world.map[testLeftInfo.oy][testLeftInfo.ox].segment[testLeftInfo.y][testLeftInfo.x];
		if(tileLeft == 9) {
			availableDirections.push("left");
		}
	}
	if(testUpInfo.toTest) {
		var tileUp = world.map[testUpInfo.oy][testUpInfo.ox].segment[testUpInfo.y][testUpInfo.x];
		if(tileUp == 9) {
			availableDirections.push("up");
		}
	}
	if(testDownInfo.toTest) {
		var tileDown = world.map[testDownInfo.oy][testDownInfo.ox].segment[testDownInfo.y][testDownInfo.x];
		if(tileDown == 9) {
			availableDirections.push("down");
		}
	}
	////////////////////////////////////////

	return availableDirections;
}


function determineTile(npc, id) {
	var player = PLAYER_LIST[id];
	if(player) {
		var world = GLOBAL_WORLD_LIST[player.worldId];
		var testX = (npc.x/18)/32;
		var testY = (npc.y/18)/32;
		var xOuterIndex = Math.floor(testX);
		var yOuterIndex = Math.floor(testY);
		var nx = testX - xOuterIndex;
		var ny = testY - yOuterIndex;
		var xIndex = Math.floor((nx*32*18)/32);
		var yIndex = Math.floor((ny*32*18)/32);

		var tile = world.map[yOuterIndex][xOuterIndex].segment[yIndex][xIndex];
	} else {
		return "error";
	}
}

function checkCurrentSpellProgress(id) {
	var player = PLAYER_LIST[id];

	var currentSpell = "";
	for(var i in player.spell) {
		var toAdd = player.spell[i];
		currentSpell = currentSpell + toAdd.toString();

	}
	console.log(currentSpell);

}






setInterval(function()
{
	//Update timing varialbes
	now = Date.now();
	gameTime = (now - startTime);
	dt = gameTime/1000;


	//end

	var pack = [];

	var wallData = [];

	for(var i in PLAYER_LIST)
	{
		//Relevent Player Data here
		var player = PLAYER_LIST[i];
		if (player){
			if(player.ready) {
			var prevs = updatePosition(player);
			checkCollisions(player);
			}
		}
	}
	var player_pack = [];

	for(var i in GLOBAL_WORLD_LIST) {
		var world = GLOBAL_WORLD_LIST[i];

		//Update player attacks.


		//Load player data to others
		for(var k in world.roomData.playerlist) {
			var player = PLAYER_LIST[world.roomData.playerlist[k]];
			if(player) {
				player_pack.push({
					logged: player.logged,
					health: player.health,
					maxHealth: player.maxHealth,
					mana: player.mana,
					size: player.size,
					id: player.id,
					x: player.x,
					y: player.y,
					color: player.color,
					speed: player.speed,
					pressingUp: player.pressingUp,
					pressingDown: player.pressingDown,
					pressingLeft: player.pressingLeft,
					pressingRight: player.pressingRight,
					cantMove: player.cantMove,
					ready: player.ready,
					worldId: player.worldId,
					castingSpell: player.castingSpell,
					spell: player.spell,
					direction: player.direction,
					animTick: player.animTick,
					selectedAbility: player.selectedAbility
				});
			}
		}
		//console.log("Existing Players for World " + i);

		for(var j in world.roomData.playerlist) {
			var player = PLAYER_LIST[world.roomData.playerlist[j]];
			if(player) {
				var socketId = world.roomData.playerlist[j];
				var socket = SOCKET_LIST[socketId];
				socket.emit("newNPCList", {ghosts: GLOBAL_NPC_LIST[i].ghosts, rats: GLOBAL_NPC_LIST[i].rats, map: GLOBAL_WORLD_LIST[i].map, shopkeeper: GLOBAL_NPC_LIST[i].ShopKeeper, knights: GLOBAL_NPC_LIST[i].knights, attacks: GLOBAL_WORLD_LIST[i].attacks, abilities: GLOBAL_WORLD_LIST[i].abilities});
				//socket.emit("newPosition", {player: PLAYER_LIST[socket]});
				//console.log("Player: " + socketId);
				socket.emit("newPositions", {players: player_pack});
			}
		}
	}

	for(var i in GLOBAL_NPC_LIST) {

		//ABILITIES
		updateDustMites(i);

		//NPCS
		updateGhosts(i);
		updateRats(i);
		updateKnights(i);
	}

	for(var i in GLOBAL_WORLD_LIST) {
		updateAttacks(i);
	}

	for(var i in SOCKET_LIST)
	{
		var socket = SOCKET_LIST[i];
		//Send Data here
		//console.log(PLAYER_LIST[i].selectedAbility)
		socket.emit("newPosition", {player: PLAYER_LIST[i], dt: dt});
	}

}, 1000/60);

function collides(x, y, r, b, x2, y2, r2, b2) {
		    return !(r <= x2 || x > r2 || b <= y2 || y > b2);
			}
			//Checks collisions for boxes only.
			//pos = item x and y coordinates. eg [0, 0]
			//size = item dimensions (size). eg [50, 50];
			//pos2 = item 2 x and y coordinates.
			//size2 = item 2 dimensions (size).
			function boxCollides(pos, size, pos2, size2) {
			    return collides(pos[0], pos[1], pos[0] + size[0], pos[1] + size[1], pos2[0], pos2[1], pos2[0] + size2[0], pos2[1] + size2[1]);
			}
