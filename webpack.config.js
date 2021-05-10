const path = require('path');
const dotenvPath = path.resolve(
	path.join(__dirname, 'src/.env')
);
require('dotenv').config({ path: dotenvPath });

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const NODE_ENV = process.env.NODE_ENV || 'development';
const ouputDirName = 'dist';
const clientPath = './src/client';


module.exports = {
	mode: NODE_ENV,

	entry: `${clientPath}/index.ts`,
	output: {
		clean: true,
		filename: '[name].js',
		path: path.resolve(__dirname, ouputDirName),
	},

	resolve: {
		extensions: ['.js', '.ts', '.jsx', '.tsx']
	},

	plugins: [
		new HtmlWebpackPlugin({
			title: 'teacher.solar',
			template: `${clientPath}/index.html`,
			minify: false,
			inject: 'body',
		}),

		new webpack.EnvironmentPlugin([
			'NODE_ENV',
			'SERVER_PORT'
		]),
	],

	devtool: (NODE_ENV === 'development')
		? 'inline-source-map'
		: 'source-map',

	module: {
		rules: [
			{
				test: /\.(js|jsx|ts|tsx)$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			},

			{
				test: /\.css$/i,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
						}
					}
				],
			},
		]
	},

	optimization: {
		minimize: NODE_ENV === 'production',

		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendor',
					chunks: 'initial',
					enforce: true
				},
			},
		},
	},

	devServer: {
		public: process.env.SERVER_NAME,
		port: process.env.HTTP_SERVER_PORT,
		host: process.env.SERVER_IP,
		contentBase: path.join(__dirname, ouputDirName),
		compress: true,

	},
};
