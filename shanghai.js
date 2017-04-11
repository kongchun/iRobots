var gps = require('./gps.js');
var db = require('./db.js')("10.82.0.1", "shanghai_grid");
// 120.854729,31.114449
// 121.268668,30.686089
// 121.990187,31.52166
// 121.318686,31.891284
// 

var distance = 500;
var minLng = 120.862372;
var maxLng = 122.006022;
var minLat = 30.676443;
var maxLat = 31.8733;


var points = gps.getGrids(minLng, minLat, maxLng, maxLat, distance);



db.open("path").then(function() {
	return db.findToArray({}, {
		_id: 0
	})
}).then(function(path) {
	db.close()
	console.log(path.length);
	//过滤上海边界
	var pt = points.filter((i) => {
		if (gps.isPointInPolygon(i.center[1], i.center[0], path)) {
			return true;
		};
		var flag = false;
		i.grids.forEach((it) => {
			if (gps.isPointInPolygon(it[1], it[0], path)) {
				flag = true;
			}
		})
		return flag;
	})
	return pt

}).then(function(pt) {
	pt.forEach(function(i) {
		i.gcj_02 = i.grids.map((j, k) => {
			return gps.bd_decrypt(j[1], j[0])
		})
		i.wgs_84 = i.gcj_02.map((j, k) => {
			return gps.gcj_decrypt(j.lat, j.lng)
		})
	})
	return pt;
}).then(function(pt) {
	console.log(pt);
	db.open("grid_500").then(function() {
		return db.collection.insertMany(pt);
	}).then(function() {
		db.close()
		console.log("success")
	}).catch(function(e) {
		db.close();
		console.log(e)
	})
}).catch(function(e) {
	db.close();
	console.log(e)
})