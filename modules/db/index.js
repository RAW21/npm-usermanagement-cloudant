const Cloudant = require('@cloudant/cloudant');
const Promise = require('bluebird');
const required_parameters = ['username', 'password', 'url'];
const default_dbname = 'users';

function createGenericCallback(cb) {
	return (err, result) => {
		err ? cb(err, null) : cb(null, result);
	};
}

class DB {
	constructor() {
		if (arguments.length === 0) {
			throw new Error('Missing required parameters: username, password');
		}
		this.username = arguments[0].username;
		this.password = arguments[0].password;
		this.url = arguments[0].url;
		this.port = arguments[0].port;
		this.host = arguments[0].host;
		this.dbname = arguments[0].dbname || default_dbname;

		for (let param of required_parameters) {
			if (typeof this[param] === 'undefined') {
				throw new Error('Missing required parameter: ' + param);
			}
		}

		this.setDb();
	}

	setDb() {
		this.cloudant = Cloudant({
			username: this.username,
			password: this.password,
			url: this.url,
			host: this.host,
			port: this.port
		});
		this.db = this.cloudant.db;
		this.use();
	}

	use() {
		this.db = this.db.use(this.dbname);
	}

	_insert(doc, _id, cb) {
		cb = cb || _id;
		typeof _id === 'function' ? _id = undefined : null;
		this.db.insert(doc, _id, (err, body, header) => {
			err ? cb(err, null) : cb(null, body);
		});
	}

	async insert(doc, _id) {
		return await ((Promise.promisify(this._insert)).bind(this))(doc, _id);
	}

	_get(_id, params, cb) {
		return this.db.get(_id, params, createGenericCallback(cb));
	}

	async get(_id, params) {
		return await ((Promise.promisify(this._get)).bind(this))(_id, params);
	}

	_fetch(_id, cb) {
		return this.db.fetch(_id, createGenericCallback(cb));
	}

	async fetch(_id) {
		return await ((Promise.promisify(this._fetch)).bind(this))(_id);
	}

	_find(query, cb) {
		return this.db.find(query, createGenericCallback(cb));
	}

	async find(query) {
		return await ((Promise.promisify(this._find)).bind(this))(query);
	}

	_getIndexes(cb) {
		this.db.index(createGenericCallback(cb));
	}

	async getIndexes() {
		return await ((Promise.promisify(this._getIndexes)).bind(this))();
	}

	_createIndex(indexJson, cb) {
		this.db.index(indexJson, createGenericCallback(cb));
	}

	async createIndex(indexJson) {
		return await ((Promise.promisify(this._createIndex)).bind(this))(indexJson);
	}

	async update(doc) {
		let doc_with_rev = await this.get(doc._id);
		for (let key in doc) {
			if (key !== '_rev') {
				doc_with_rev[key] = doc[key];
			}
		}
		return await this.insert(doc_with_rev);
	}

	_destroy(_id, _rev, cb) {
		return this.db.destroy(_id, _rev, createGenericCallback(cb));
	}

	async destroy(_id, _rev) {
		return await ((Promise.promisify(this._destroy)).bind(this))(_id, _rev);
	}

	async delete(_id) {
		let doc_with_rev = await this.get(_id);
		return await this.destroy(_id, doc_with_rev._rev);
	}
}


module.exports = DB;
