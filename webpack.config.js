const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');


const ouputDirName = 'dist';


module.exports = {
	entry: './src/index.ts',
	output: {
		clean: true,
		filename: 'main.js',
		path: path.resolve(__dirname, ouputDirName),
	},

	resolve: {
		extensions: ['.js', '.ts', '.jsx', '.tsx']
	},

	plugins: [
		new HtmlWebpackPlugin({
			title: 'teacher.solar',
			template: './src/index.html',
			minify: false,
			inject: 'body',
		}),
	],

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

	devServer: {
		contentBase: path.join(__dirname, ouputDirName),
		compress: true,
		// port: 9000,
	},
};
