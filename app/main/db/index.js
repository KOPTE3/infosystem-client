const path = require('path');
const Datastore = require('nedb-promises');
const fse = require('fs-extra');
const config = require('../config');

const root = config.datastoreRoot;
fse.ensureDirSync(root);

function db (name) {
	return Datastore.create({
		filename: path.resolve(root, `${name}.db`),
		autoload: true,
	});
}

export default {};
