import { dialog, shell } from 'electron';
import promiseIpc from 'electron-promise-ipc';
import fse from 'fs-extra';
import * as path from 'path';
import config from '../config';
import Generator from '../generator';


const log = require('electron-log');

log.info('inside editor.js');
try {
	log.info('process.cwd', process.cwd());
} catch (e) {
	console.error(e);
}

promiseIpc.on('load-source-data', async function() {
	try {

		log.info('on load-source-data');

		const filenames = dialog.showOpenDialog(config.mainWindow, {
			title: 'Открыть',
			buttonLabel: 'Открыть',
			filters: [
				{
					name: 'JSON Files', extensions: [ 'json' ],
				},
			],
		});

		if (filenames && filenames.length === 1) {
			const [ filename ] = filenames;
			const source = await fse.readFile(path.resolve(filename));
			return JSON.parse(source);
		}

		return null;

	} catch (err) {
		log.error(err);
		throw err;
	}
});

promiseIpc.on('save-result-data', async function(result) {
	try {
		log.info('on save-result-data');

		const content = JSON.stringify(result, null, ' ');
		const filename = `${result.name} - full.json`;

		const filepath = dialog.showSaveDialog(config.mainWindow, {
			title: 'Сохранить',
			defaultPath: filename,
			buttonLabel: 'Сохранить',
			filters: [
				{
					name: 'JSON Files', extensions: [ 'json' ],
				},
			],
		});

		if (filepath) {
			await fse.writeFile(path.resolve(filepath), content, 'utf8');
		}
	} catch (err) {
		log.error(err);
		throw err;
	}
});


promiseIpc.on('preview-result-data', async function(result) {
	try {
		log.info('on preview-result-data');

		const directories = dialog.showOpenDialog(config.mainWindow, {
			title: 'Выберите директорию для сохранения',
			properties: [ 'openDirectory', 'createDirectory', 'promptToCreate' ],
		});

		if (directories.length !== 1) {
			throw new Error('Не выбрана директория');
		}

		const [ directory ] = directories;

		const g = new Generator(result, result);

		await g.init();
		// await g.saveHTML();

		await g.generatePDFs(directory);

		shell.openExternal(`file://${directory}`);
	} catch (err) {
		log.error(err);
		throw err;
	}
});
