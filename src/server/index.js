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
	console.log('client connected:', socket.id);
});

const port = 3000;
httpServer.listen(port);
