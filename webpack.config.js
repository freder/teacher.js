const path = require('path');


module.exports = {
	entry: './src/index.ts',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'dist'),
	},

	resolve: {
		extensions: ['.js', '.ts', '.jsx', '.tsx']
	},

	devtool: 'inline-source-map',

	module: {
		rules: [
			{
				test: /\.(js|jsx|ts|tsx)$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			}
		]
	},
};
