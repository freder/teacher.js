import { io } from 'socket.io-client';


function main() {
	console.log('👍');

	const socket = io('http://localhost:3000');

	socket.on('connect', () => {
		console.log('connect', socket.id);
	});

	socket.on('disconnect', () => {
		console.log('disconnect');
	});
}


main();
export {};
