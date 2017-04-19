//App.js
//use for bug testing if need be
//console.log(GLOBAL_NPC_LIST[1].ghosts);
//server.js
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


//objects
var Player = function(id){
	var self = {
		//
		health: 50,
		maxHealth: 50,
		mana: 25,
		size: 8,
		id: id,
		x: 48,
		y: 48,
		color: "#008000",
		speed: 2.5,
		pressingUp: false,
		pressingDown: false,
		pressingLeft: false,
		pressingRight: false,
		cantMove: false,
		ready: false,
		GAME_MAP: "none",
		world: id
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
		availableDirections: []
	};
	return self;
}

var Knight = function(id, x, y, vx, vy){
	var self = {
		health: 2500,
		maxHealth: 2500,
		mana: 250,
		maxMana: 250,
		size: 12,
		id: id,
		x: x,
		y: y,
		color: "#D3D3D3",
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
		availableDirections: []
	};
	return self;
}

var Rat = function(id, x, y, vx, vy){
	var self = {
		health: 15,
		maxHealth: 15,
		mana: 0,
		maxMana: 0,
		size: 8,
		id: id,
		x: x,
		y: y,
		color: "#a55108",
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
		availableDirections: []
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
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
		console.log(colors.magenta('[Server]:') + ' Player with Id ' + colors.yellow('"'+ socket.id + '"') + '" has ' + colors.red('disconnected.'));
	});

	socket.emit('receivedConnect',{id: socket.id});

	socket.on('keyPress', function(data)
	{
		var player = PLAYER_LIST[socket.id];
		if(data.inputId == "up")
		{
			player.pressingUp = data.state;
		}
		if(data.inputId == "down")
		{
				player.pressingDown = data.state;
		}

		if(data.inputId == "right")
		{
			player.pressingRight = data.state;
		}
		if(data.inputId == "left")
		{
				player.pressingLeft = data.state;
		}
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
			map: data.map
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
						var setX = j * 9 * 32;
						var setY = i * 9 * 32;
						var randX = Math.floor(Math.random()*(9*32));
						var randY = Math.floor(Math.random()*(9*32));

						while(determineTileFromPx(setX + randX, setY + randY, socket.id) == 1) {
							var randX = Math.floor(Math.random()*(9*32));
							var randY = Math.floor(Math.random()*(9*32));
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

});

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
			var randomX = Math.floor(Math.random()*(world.roomData.roomLengthX*9*32));
			var randomY = Math.floor(Math.random()*(world.roomData.roomLengthY*9*32));

			while(determineTileFromPx(randomX, randomY, id) == 1) {
				randomX = Math.floor(Math.random()*(world.roomData.roomLengthX*9*32));
				randomY = Math.floor(Math.random()*(world.roomData.roomLengthY*9*32));
			}

			var randomId = Math.random();
			var newRat = new Rat(randomId, randomX, randomY, 0,0);
			worldNpc.rats.push(newRat);
	}
}

function determineTileFromPx(x, y, id) {
	var world = GLOBAL_WORLD_LIST[id];
	var testX = (x/9)/32;
	var testY = (y/9)/32;
	var xOuterIndex = Math.floor(testX);
	var yOuterIndex = Math.floor(testY);
	var nx = testX - xOuterIndex;
	var ny = testY - yOuterIndex;
	var xIndex = Math.floor((nx*32*9)/32);
	var yIndex = Math.floor((ny*32*9)/32);

	return world.map[yOuterIndex][xOuterIndex].segment[yIndex][xIndex];
}

function updateRats(id) {
	for(var i in GLOBAL_NPC_LIST[id].rats) {
		var rat = GLOBAL_NPC_LIST[id].rats[i];
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
				if(tempTile[rat.direction] == 1){
					rat.direction = "none";
					rat.status = "idle";
				}




				if(rat.moveTime > (dt-rat.setMove)) {
					//Ghost has surpassed alloted movement time.
					rat.x += rat.vx * rat.speed;
					rat.y += rat.vy * rat.speed;




					//FINAL CHECK, ANY OTHER UPDATES MUST GO ABOVE.

					if(rat.x < 32 || rat.x + rat.size > (GLOBAL_WORLD_LIST[id].roomData.roomLengthX*9*32)-32-rat.size || rat.y < 32+rat.size || rat.y > (GLOBAL_WORLD_LIST[id].roomData.roomLengthY*9*32)-32-rat.size ) {
						rat.x -= rat.vx * rat.speed;
						rat.y -= rat.vy * rat.speed;
						rat.status = "idle";
					}

				} else {
					rat.status = "idle";
				}
			}

	}
}


function updateGhosts(id) {
	for(var i in GLOBAL_NPC_LIST[id].ghosts) {
		var ghost = GLOBAL_NPC_LIST[id].ghosts[i];
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

					if(ghost.x < 32 || ghost.x + ghost.size > (GLOBAL_WORLD_LIST[id].roomData.roomLengthX*9*32)-32-ghost.size || ghost.y < 32+ghost.size || ghost.y > (GLOBAL_WORLD_LIST[id].roomData.roomLengthY*9*32)-32-ghost.size ) {
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


function updatePosition(player)
{
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
	var world = GLOBAL_WORLD_LIST[player.world];
	//determineTile(player);
	if(player.ready) {
		for(var i in world.map) {
			for(var j in world.map[i]) {
				for(var k in world.map[i][j].segment) {
					for(var l in world.map[i][j].segment[k]) {
						var tile = world.map[i][j].segment[k][l];

						if(tile == 1) {

							if(boxCollides([player.x-player.size+5, player.y-player.size+5],[player.size*2-10,player.size*2-10],[(j*32*9) + (l*32),(i*32*9) + (k*32)],[32,32])){
								var val1 = (i*32*9) + (l*32);
								var val2 = (j*32*9) + (k*32);
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
		var testX = (npc.x/9)/32;
		var testY = (npc.y/9)/32;
		var xOuterIndex = Math.floor(testX);
		var yOuterIndex = Math.floor(testY);
		var nx = testX - xOuterIndex;
		var ny = testY - yOuterIndex;
		var xIndex = Math.floor((nx*32*9)/32);
		var yIndex = Math.floor((ny*32*9)/32);

		//INIT NORM VALUES
		var testRightInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};
		var testLeftInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};
		var testUpInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};
		var testDownInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex};

		//Change variables to suit the direction to be tested
		//Change variables to suit the direction to be tested
		if(testRightInfo.x == 8) {
			if(testRightInfo.ox !== world.roomData.roomLengthX) {
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
				testLeftInfo.x = 8;
				testLeftInfo.ox -= 1;
			} else {
				testLefttInfo.toTest = false;
			}
		} else {
			//Within normal bounds for segment.
			testLeftInfo.x -= 1;
		}
		/////////////////////////////////

		if(testUpInfo.y == 0) {
			if(testUpInfo.oy !== 0) {
				testUpInfo.y = 8;
				testUpInfo.oy -= 1;
			}
		} else {
			//Within normal bounds for segment.
			testUpInfo.y -= 1;
		}

		/////////////////////////////////
		if(testDownInfo.y == 8) {
			if(testDownInfo.oy !== world.roomData.roomLengthY) {
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
	var testX = (npc.x/9)/32;
	var testY = (npc.y/9)/32;
	var xOuterIndex = Math.floor(testX);
	var yOuterIndex = Math.floor(testY);
	var nx = testX - xOuterIndex;
	var ny = testY - yOuterIndex;
	var xIndex = Math.floor((nx*32*9)/32);
	var yIndex = Math.floor((ny*32*9)/32);


	//INIT NORM VALUES
	var testRightInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};
	var testLeftInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};
	var testUpInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};
	var testDownInfo = {ox: xOuterIndex, oy: yOuterIndex, x: xIndex, y: yIndex, toTest: true};

	//Change variables to suit the direction to be tested
	if(testRightInfo.x == 8) {
		if(testRightInfo.ox !== world.roomData.roomLengthX) {
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
			testLeftInfo.x = 8;
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
			testUpInfo.y = 8;
			testUpInfo.oy -= 1;
		}
	} else {
		//Within normal bounds for segment.
		testUpInfo.y -= 1;
	}

	/////////////////////////////////
	if(testDownInfo.y == 8) {
		if(testDownInfo.oy !== world.roomData.roomLengthY) {
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


	//TEST TILES FOR THEIR number
	//////////////////////////////
	//Test right
	if(testRightInfo.toTest) {
		var tileRight = world.map[testRightInfo.oy][testRightInfo.ox].segment[testRightInfo.y][testRightInfo.x];
		if(tileRight !== 1) {
			availableDirections.push("right");
		}
	}
	if(testLeftInfo.toTest) {
		var tileLeft = world.map[testLeftInfo.oy][testLeftInfo.ox].segment[testLeftInfo.y][testLeftInfo.x];
		if(tileLeft !== 1) {
			availableDirections.push("left");
		}
	}
	if(testUpInfo.toTest) {
		var tileUp = world.map[testUpInfo.oy][testUpInfo.ox].segment[testUpInfo.y][testUpInfo.x];
		if(tileUp !== 1) {
			availableDirections.push("up");
		}
	}
	if(testDownInfo.toTest) {
		var tileDown = world.map[testDownInfo.oy][testDownInfo.ox].segment[testDownInfo.y][testDownInfo.x];
		if(tileDown !== 1) {
			availableDirections.push("down");
		}
	}
	////////////////////////////////////////

	return availableDirections;
}


function determineTile(npc, id) {
	var player = PLAYER_LIST[id];
	if(player) {
		var world = GLOBAL_WORLD_LIST[player.world];
		var testX = (npc.x/9)/32;
		var testY = (npc.y/9)/32;
		var xOuterIndex = Math.floor(testX);
		var yOuterIndex = Math.floor(testY);
		var nx = testX - xOuterIndex;
		var ny = testY - yOuterIndex;
		var xIndex = Math.floor((nx*32*9)/32);
		var yIndex = Math.floor((ny*32*9)/32);

		var tile = world.map[yOuterIndex][xOuterIndex].segment[yIndex][xIndex];
	} else {
		return "error";
	}
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

	for(var i in GLOBAL_WORLD_LIST) {
		var world = GLOBAL_WORLD_LIST[i];
		for(var j in world.roomData.playerlist) {
			var player = PLAYER_LIST[world.roomData.playerlist[j]];
			if(player) {
				var socketId = world.roomData.playerlist[j];
				var socket = SOCKET_LIST[socketId];
				socket.emit("newNPCList", {ghosts: GLOBAL_NPC_LIST[i].ghosts, rats: GLOBAL_NPC_LIST[i].rats, map: GLOBAL_WORLD_LIST[i].map, shopkeeper: GLOBAL_NPC_LIST[i].ShopKeeper, knights: GLOBAL_NPC_LIST[i].knights});
				//socket.emit("newPosition", {player: PLAYER_LIST[socket]});
			}
		}
	}

	for(var i in GLOBAL_NPC_LIST) {
		determineTile(GLOBAL_NPC_LIST[i].rats[0], i);
		updateGhosts(i);
		updateRats(i);
	}

	for(var i in SOCKET_LIST)
	{
		var socket = SOCKET_LIST[i];
		//Send Data here
		socket.emit("newPosition", {player: PLAYER_LIST[i]});
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
