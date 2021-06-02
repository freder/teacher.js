import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';


let io: Server;


export function createIoServer(httpServer: HttpServer): Server {
	io = new Server(
		httpServer,
		{
			serveClient: false,
			cors: {
				origin: '*', // TODO: tighten security
				methods: ['GET', 'POST'],
			}
		}
	);
	return io;
}


export function getIo(): Server {
	return io;
}
