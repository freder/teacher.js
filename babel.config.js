module.exports = {
	presets: [
		'@babel/typescript',
		'@babel/preset-env'
	],

	plugins: [
		'@babel/proposal-class-properties',
		'@babel/proposal-object-rest-spread'
	],

	targets: {
		node: '6.5'
	}
};

// "browserslist": [
// 	"defaults",
// 	"last 2 versions",
// 	"> 1%",
// 	"not dead",
// 	"not IE > 0"
// ],
