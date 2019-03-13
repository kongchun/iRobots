var loader = require('./loader.js');

function loadPlaceAPI(name, city, page_num = 1) {
	function getPlaceUrl(name, city) {
		return `https://apis.map.qq.com/ws/place/v1/search?keyword=${name}&boundary=region(${city},0)&filter=category=地铁&page_size=10&page_index=${page_num}&output=json&key=REWBZ-EW4KU-DMFVP-27LKZ-SS3VJ-6HB5L`
	}
	var url = encodeURI(getPlaceUrl(name, city));
	//console.log(url)
	return loader.getJSON((url),{delay:500}).then(function(data) {
		//console.log(data);
		return data;
	}).catch(function(e) {
		console.log(e);
	})
}




module.exports = {
	loadPlaceAPI: loadPlaceAPI
};

// loadPlaceAPI("乐桥","苏州").then((data)=>{
// 	console.log({station:i,location:(data.data[0].location)});
// })

// let station = [{"stationId":"0736","stationName":"木里","begintime":"06:10:00","endtime":"22:15:00","distance":1578.364,"time":180,"change":""},{"stationId":"0735","stationName":"苏州湾北","begintime":"06:12:00","endtime":"22:17:00","distance":1106.419,"time":120,"change":""},{"stationId":"0734","stationName":"天鹅荡路","begintime":"06:14:00","endtime":"22:19:00","distance":1492.68,"time":180,"change":""},{"stationId":"0733","stationName":"文溪路","begintime":"06:17:00","endtime":"22:22:00","distance":1373.284,"time":120,"change":""},{"stationId":"0732","stationName":"越溪","begintime":"06:19:00","endtime":"22:24:00","distance":1348.973,"time":120,"change":""},{"stationId":"0731","stationName":"石湖莫舍","begintime":"06:21:00","endtime":"22:26:00","distance":1863.983,"time":180,"change":""},{"stationId":"0730","stationName":"蠡墅","begintime":"06:24:00","endtime":"22:29:00","distance":1257.776,"time":120,"change":""},{"stationId":"0729","stationName":"红庄","begintime":"","endtime":"","distance":0,"time":0,"change":"4"}]
// import helper from "./helper.js";
// helper.iteratorArr(station, (i) => {
// 	return loadPlaceAPI(i.stationName,"苏州").then((data)=>{
// 		return ({station:i.stationName,location:(data.data[0].location)});
// 	})
// }).then((data)=>{
// 	console.log(JSON.stringify(data));
// })
