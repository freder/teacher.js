const http = require('http');
const path = require('path');

const socketio = require('socket.io');
const debug = require('debug');
const dotenvPath = path.resolve(
	path.join(__dirname, '../.env')
);
require('dotenv').config({ path: dotenvPath });


const port = process.env.SERVER_PORT || 3000;

const debugPrefix = 'T.S';
const logSlideCmd = debug(`${debugPrefix}:cmd:slides`);
const logNetEvent = debug(`${debugPrefix}:net`);
const logInfo = debug(`${debugPrefix}:info`);


function main() {
	const httpServer = http.createServer();
	const io = socketio(
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
		socket.on('slidechanged', (data) => {
			logSlideCmd(data);
			// relay to all clients
			io.emit('slidechanged', data);
		});
	});

	logInfo(`http://localhost:${port}`);
	httpServer.listen(port);
}


main();
