const fs = require('fs');
const path = require('path');

const R = require('ramda');


function parseEntry(line) {
	const parts = line.split(' ');
	const ts = new Date(parts[0]);
	const msgType = parts[1];
	const payload = JSON.parse(parts[2] || 'null');
	return { ts, msgType, payload };
}


function addDuration(entry, i, list) {
	const { ts } = entry;
	let timeSincePrevious = 0;
	if (i > 0) {
		timeSincePrevious = ts - list[i - 1].ts;
	}
	return { ...entry, timeSincePrevious };
}


// read file
const logFilePath = path.resolve('log.txt');
console.log(logFilePath);
const content = fs.readFileSync(logFilePath).toString();

// parse entries
let entries = R.pipe(
	R.split(/[\n\r]+/g),
	R.map(R.trim),
	R.filter((s) => s !== ''),
)(content);
entries = entries
	.map(parseEntry)
	.map(addDuration);

// replay
// simplest solution: start all timers at once
let offset = 0;
entries.forEach((entry) => {
	const delay = offset + entry.timeSincePrevious;
	setTimeout(
		() => console.log(entry),
		delay
	);
	offset = delay;
});
