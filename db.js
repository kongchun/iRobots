var mongodb = require("mongodb");
var helper = require("./helper.js");
var MongoClient = mongodb.MongoClient;
//var url = 'mongodb://127.0.0.1:27017/';
class DB {
	constructor(url = "127.0.0.1", dbName = "test", port="27017") {
		this.url = `mongodb://${url}:${port}/${dbName}`;
		this.db = null;
		this.collection = null;
		this.ObjectId = mongodb.ObjectId;
		this.Code = mongodb.Code;
	}
	open(table) {
		this.close();
		return new Promise((resolve, reject) => {
			if (this.db && this.db != null) {

				resolve(this.collection);
				return;
			}
			MongoClient.connect(this.url).then((db) => {
				//console.log("openDB")
				this.db = db;
				var collection = this.collection = db.collection(table);
				resolve(this.collection);
			}).catch(reject);
		})

	}

	close() {
		this.db && this.db.close();
		this.db = null;
		this.collection = null;
	}

	insert(rows) {
		if (!Array.isArray(rows)) {
			rows = [rows]
		}
		// rows.map((i) => {
		// 	i["_id"] = (new mongodb.ObjectId().toString())
		// });
		return new Promise((resolve, reject) => {
			this.collection.insert(rows, {
				w: 1
			}).then(resolve).catch(reject);
		})
	}

	updateById(id, row) {
		return this.collection.update({
			_id: this.ObjectId(id)
		}, {
			$set: row
		})
	}

	findToArray(cond = {}, keys = {}) {
		return this.collection.find(cond, keys).toArray();
	}



	insertUnique(rows, key) {

		return new Promise((resolve, reject) => {
			if (!Array.isArray(rows)) {
				rows = [rows]
			}

			var it = rows[Symbol.iterator]();
			var i = ((item) => {

				if (item.done) {
					resolve()
					return;
				}

				let row = item.value;

				var seachKey = row;
				if (key) {
					var obj = {};
					obj[key] = row[key]
					seachKey = obj;
				}
				//console.log(row)
				this.collection.findOne(seachKey).then((t) => {
					//console.log(t.length > 0)
					if (!t) {
						return this.insert(row);
					} else {
						console.log(row[key], "is not Unique");
						return row
					}
				}).then(function() {
					i(it.next());
				}).catch(reject);

			})
			i(it.next())

		})
	}

	updateIterator(fromCond = {}, keyCond = {}, func = function() {
		return {}
	}) {
		return this.findToArray(fromCond, keyCond).then((arr) => {
			//console.log(arr.length)
			return helper.iteratorArr(arr, (data) => {

				return this.updateById(data._id, func(data))
			}).then(function(data) {
				//console.log(data)
				return data;
			})
		}).catch(function(e) {
			console.log(e)
			return null;
		})
	}

}

module.exports = function(url, dbName,port) {
	return new DB(url, dbName,port);
}
