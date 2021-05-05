const path = require('path');
const dotenvPath = path.resolve(
	path.join(__dirname, '../.env')
);
require('dotenv').config({ path: dotenvPath });

const debug = require('debug');
const debugPrefix = 'T.S';
const logSlideCmd = debug(`${debugPrefix}:cmd:slides`);
const logNetEvent = debug(`${debugPrefix}:net`);
const logInfo = debug(`${debugPrefix}:info`);

const httpServer = require('http').createServer();
const io = require('socket.io')(
	httpServer,
	{
		serveClient: false,
		// TODO: tighten security
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		}
	}
);

io.on('connection', (socket) => {
	logNetEvent('client connected:', socket.id);
	// io.to(socket.id).emit('hello', `oh, hey ${socket.id}`);

	// client may request admin role
	socket.on('request-role:admin', () => {
		socket.emit('grant-role:admin');
	});

	// TODO: check if it comes from an admin user
	socket.on('slides', (cmd) => {
		logSlideCmd(cmd);
		// relay to all clients
		io.emit('slides', cmd);
	});
});

const port = process.env.SERVER_PORT || 3000;
logInfo(`http://localhost:${port}`);
httpServer.listen(port);
