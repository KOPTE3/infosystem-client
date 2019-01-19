import MenuBuilder from './menu';
import config from './config';


import './src/editor';


const log = require('electron-log');

export default function boot (mainWindow) {
	const menuBuilder = new MenuBuilder(mainWindow);
	menuBuilder.buildMenu();

	log.info('App config', config);

	config.mainWindow = mainWindow;
}
