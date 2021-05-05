const httpServer = require('http').createServer();
const io = require('socket.io')(
	httpServer,
	{
		serveClient: false,
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		}
	}
);

io.on('connection', (socket) => {
	// TODO: use logging library
	console.log('client connected:', socket.id);
	// io.to(socket.id).emit('hello', `oh, hey ${socket.id}`);

	// client may request admin role
	socket.on('request-role:admin', () => {
		socket.emit('grant-role:admin');
	});

	// TODO: check if it comes from an admin user
	socket.on('slides', (cmd) => {
		console.log(cmd);
		// relay to all clients
		io.emit('slides', cmd);
	});
});

const port = 3000;
httpServer.listen(port);
