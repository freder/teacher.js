const path = require('path');
const dotenvPath = path.resolve(
	path.join(__dirname, 'src/.env')
);
require('dotenv').config({ path: dotenvPath });

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleStatsWebpackPlugin } = require('bundle-stats-webpack-plugin');
const { StatsWriterPlugin } = require('webpack-stats-plugin');



const NODE_ENV = process.env.NODE_ENV || 'development';
const ouputDirName = 'dist';
const clientPath = './src/client';


const plugins = [
	new HtmlWebpackPlugin({
		title: 'teacher.solar',
		template: `${clientPath}/index.html`,
		minify: false,
		inject: 'body',
		chunks: ['main', 'vendor'],
	}),

	new webpack.EnvironmentPlugin([
		'NODE_ENV',
		'SERVER_PORT',
		'SERVER_NAME',
	]),
];
if (NODE_ENV === 'production') {
	plugins.push(
		new BundleStatsWebpackPlugin({
			outDir: '../stats',
			// baseline: true,
			stats: {
				excludeAssets: [/stats/],
			},
		})
	);
	plugins.push(
		new StatsWriterPlugin({
			filename: '../stats/webpack-stats.json',
			stats: {
				all: true,
				source: false,
			},
		})
	);
}


module.exports = {
	mode: NODE_ENV,

	entry: {
		main: `${clientPath}/index.ts`,
		'reveal-hooks': `${clientPath}/reveal-hooks.ts`
	},
	output: {
		clean: true,
		filename: '[name].js',
		path: path.resolve(__dirname, ouputDirName),
	},

	resolve: {
		extensions: ['.js', '.ts', '.jsx', '.tsx']
	},

	plugins: plugins,

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
		public: process.env.SERVER_NAME || undefined,
		port: process.env.CLIENT_DEV_SERVER_PORT,
		host: process.env.CLIENT_DEV_SERVER_HOST,
		contentBase: path.join(__dirname, ouputDirName),
		compress: true,
	},
};
