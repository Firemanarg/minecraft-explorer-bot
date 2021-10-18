const mineflayer = require('mineflayer');
const Vec3 = require('vec3').Vec3;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const GoalXZ = goals.GoalXZ;

/*
** To configure the BOTS, change those parameters:
** HOST -> Server IP
** PORT -> Server PORT
** USERNAME_PREFIX -> Text to be prepended to Bot index
** BOTS_AMOUNT -> Bots count
** USERNAME_INITIAL_INDEX -> Initial index for Bot generation
** BOTS_STARTER_COORDS -> Bots starter coordinates
** STARTER_ANGLE -> Initial Bot angle. Angle will be sliced into
**					fractions, each Bot will have a diferent
**					movement angle
** AUTO_ANGLE -> Auto-calculate Bot angle fraction (Starting at
**					STARTER_ANGLE, dividing it by 360 degrees)
** ANGLE_OFFSET -> In case of disabled AUTO_ANGLE, this value will
**					be considered as angle diference from previous
**					(last generated Bot plus ANGLE_OFFSET)
*/

// Begin - Setup

const HOST = 'localhost';
const PORT = 12345;
const USERNAME_PREFIX = "ATS_BOT_";
const BOTS_AMOUNT = 1;
const USERNAME_INITIAL_INDEX = 0;
const BOTS_STARTER_COORDS = new Vec3(0, 0, 0);
const STARTER_ANGLE = 0;
const AUTO_ANGLE = true;
const ANGLE_OFFSET = 0;

// End - Setup

function deg2rad(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function recalculateGoal(x, y, z, angle) {
	var new_goal = new Vec3(
		x + (10000 * Math.cos(deg2rad(angle))),
		0,
		z + (10000 * Math.sin(deg2rad(angle)))
	);
	console.log("Recalculated Goal -> ", new_goal);
	return (new_goal);
}

function moveToGoal(bot) {
	const mcData = require("minecraft-data")(bot.bot.version);
	const movements = new Movements(bot.bot, mcData);

	bot.bot.pathfinder.setMovements(movements);

	const goal = new GoalXZ(bot.bot_data.goal.x, bot.bot_data.goal.z);
	bot.bot.pathfinder.setGoal(goal);
}

function stopMoving(bot) {
	bot.bot.pathfinder.setGoal(null);
}

function resetInitialCoords(bot, initial_coords) {
	bot.bot_data.init_coords = new Vec3(
		initial_coords.x,
		initial_coords.y,
		initial_coords.z
	);
	bot.bot_data.goal = recalculateGoal(initial_coords.x, initial_coords.y, initial_coords.z, bot.bot_data.angle);
	bot.bot.chat("/tp ", initial_coords.x, " ", initial_coords.y, " ", initial_coords.z)
}

function generateBot(index, init_coords, angle) {
	const USERNAME = USERNAME_PREFIX + String(index);
	var out = {
		bot_data: {
			angle: 0,
			"init_coords": new Vec3(init_coords.x, init_coords.y, init_coords.z),
			goal: recalculateGoal(init_coords.x, init_coords.y, init_coords.z, angle)
		},
		bot: mineflayer.createBot({
			host: HOST,
			port: PORT,
			username: USERNAME
		})
	};
	out.bot.loadPlugin(pathfinder);

	out.bot.on("chat", (username, message) => {
		if (message === "!activate")
		{
			console.log("<%s> Command received -> %s", out.bot.username, message);
			moveToGoal(out);
		}
		else if (message === "!deactivate")
		{
			console.log("<%s> Command received -> %s", out.bot.username, message);
			stopMoving(out);
		}
		else if (message === "!rstic")
		{
			console.log("<%s> Command received -> %s", out.bot.username, message);
			const player = out.bot.players[username];
			if (!player)
			{
				out.bot.chat("Player was not found!");
				return ;
			}
			const position = player.entity.position;
			resetInitialCoords(out, position);
		}
	});
}

var bots = [];

function main() {
	let angle_fraction = ANGLE_OFFSET;
	if (AUTO_ANGLE)
		angle_fraction = 360.0 / BOTS_AMOUNT;
	for (let bot = 0; bot < BOTS_AMOUNT; bot++) {
		const index = USERNAME_INITIAL_INDEX + bot;
		let angle = STARTER_ANGLE + (angle_fraction * bot);
		bots.push(generateBot(index, BOTS_STARTER_COORDS, angle));
	}
}

main();