//高德、腾讯、图灵、阿里地图等都是 GCJ-02坐标系
//GPS WGS-84
//BAIDU BD-09

var GPS = {
	PI: 3.14159265358979324,
	x_pi: 3.14159265358979324 * 3000.0 / 180.0,
	delta: function(lat, lng) {
		// Krasovsky 1940
		//
		// a = 6378245.0, 1/f = 298.3
		// b = a * (1 - f)
		// ee = (a^2 - b^2) / a^2;
		var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
		var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
		var dLat = this.transformLat(lng - 105.0, lat - 35.0);
		var dLng = this.transformLng(lng - 105.0, lat - 35.0);
		var radLat = lat / 180.0 * this.PI;
		var magic = Math.sin(radLat);
		magic = 1 - ee * magic * magic;
		var sqrtMagic = Math.sqrt(magic);
		dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI);
		dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI);
		return {
			'lat': dLat,
			'lng': dLng
		};
	},

	//WGS-84 to GCJ-02 
	gcj_encrypt: function(wgsLat, wgsLng) {
		if (this.outOfChina(wgsLat, wgsLng))
			return {
				'lat': wgsLat,
				'lng': wgsLng
			};

		var d = this.delta(wgsLat, wgsLng);
		return {
			'lat': wgsLat + d.lat,
			'lng': wgsLng + d.lng
		};
	},
	//GCJ-02 to WGS-84
	gcj_decrypt: function(gcjLat, gcjLng) {
		if (this.outOfChina(gcjLat, gcjLng))
			return {
				'lat': gcjLat,
				'lng': gcjLng
			};

		var d = this.delta(gcjLat, gcjLng);
		return {
			'lat': gcjLat - d.lat,
			'lng': gcjLng - d.lng
		};
	},
	//GCJ-02 to WGS-84 exactly
	gcj_decrypt_exact: function(gcjLat, gcjLng) {
		var initDelta = 0.01;
		var threshold = 0.000000001;
		var dLat = initDelta,
			dLng = initDelta;
		var mLat = gcjLat - dLat,
			mLng = gcjLng - dLng;
		var pLat = gcjLat + dLat,
			pLng = gcjLng + dLng;
		var wgsLat, wgsLng, i = 0;
		while (1) {
			wgsLat = (mLat + pLat) / 2;
			wgsLng = (mLng + pLng) / 2;
			var tmp = this.gcj_encrypt(wgsLat, wgsLng)
			dLat = tmp.lat - gcjLat;
			dLng = tmp.lng - gcjLng;
			if ((Math.abs(dLat) < threshold) && (Math.abs(dLng) < threshold))
				break;

			if (dLat > 0) pLat = wgsLat;
			else mLat = wgsLat;
			if (dLng > 0) pLng = wgsLng;
			else mLng = wgsLng;

			if (++i > 10000) break;
		}
		//console.log(i);
		return {
			'lat': wgsLat,
			'lng': wgsLng
		};
	},
	//GCJ-02 to BD-09
	bd_encrypt: function(gcjLat, gcjLng) {
		var x = gcjLng,
			y = gcjLat;
		var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);
		var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);
		bdLng = z * Math.cos(theta) + 0.0065;
		bdLat = z * Math.sin(theta) + 0.006;
		return {
			'lat': bdLat,
			'lng': bdLng
		};
	},
	//BD-09 to GCJ-02
	bd_decrypt: function(bdLat, bdLng) {
		var x = bdLng - 0.0065,
			y = bdLat - 0.006;
		var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);
		var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);
		var gcjLng = z * Math.cos(theta);
		var gcjLat = z * Math.sin(theta);
		return {
			'lat': gcjLat,
			'lng': gcjLng
		};
	},
	//WGS-84 to Web mercator
	//mercatorLat -> y mercatorLng -> x
	mercator_encrypt: function(wgsLat, wgsLng) {
		var x = wgsLng * 20037508.34 / 180.;
		var y = Math.log(Math.tan((90. + wgsLat) * this.PI / 360.)) / (this.PI / 180.);
		y = y * 20037508.34 / 180.;
		return {
			'lat': y,
			'lng': x
		};
		/*
		if ((Math.abs(wgsLng) > 180 || Math.abs(wgsLat) > 90))
		    return null;
		var x = 6378137.0 * wgsLng * 0.017453292519943295;
		var a = wgsLat * 0.017453292519943295;
		var y = 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
		return {'lat' : y, 'lng' : x};
		//*/
	},
	// Web mercator to WGS-84
	// mercatorLat -> y mercatorLng -> x
	mercator_decrypt: function(mercatorLat, mercatorLng) {
		var x = mercatorLng / 20037508.34 * 180.;
		var y = mercatorLat / 20037508.34 * 180.;
		y = 180 / this.PI * (2 * Math.atan(Math.exp(y * this.PI / 180.)) - this.PI / 2);
		return {
			'lat': y,
			'lng': x
		};
		/*
		if (Math.abs(mercatorLng) < 180 && Math.abs(mercatorLat) < 90)
		    return null;
		if ((Math.abs(mercatorLng) > 20037508.3427892) || (Math.abs(mercatorLat) > 20037508.3427892))
		    return null;
		var a = mercatorLng / 6378137.0 * 57.295779513082323;
		var x = a - (Math.floor(((a + 180.0) / 360.0)) * 360.0);
		var y = (1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * mercatorLat) / 6378137.0)))) * 57.295779513082323;
		return {'lat' : y, 'lng' : x};
		//*/
	},
	// two point's distance
	// distance : function (latA, lngA, latB, lngB) {
	//     var earthR = 6371000.;
	// var qq = (lngA - lngB) * this.PI / 180;
	// console.log("qq:"+qq);
	// var z = Math.cos((lngA - lngB) * this.PI / 180);
	// console.log("z:"+z);
	//     var x = Math.cos(latA * this.PI / 180.) * Math.cos(latB * this.PI / 180.) * Math.cos((lngA - lngB) * this.PI / 180);
	//     var y = Math.sin(latA * this.PI / 180.) * Math.sin(latB * this.PI / 180.);
	//     var s = x + y;
	//     if (s > 1) s = 1;
	//     if (s < -1) s = -1;
	//     var alpha = Math.acos(s);
	//     var distance = alpha * earthR;
	// console.log("distance:"+distance);
	//     return distance;
	// },
	distance: function(latA, lngA, latB, lngB) {
		var earthR = 6371000.;
		var x = Math.cos(latA * this.PI / 180.) * Math.cos(latB * this.PI / 180.) * Math.cos((lngA - lngB) * this.PI / 180);
		var y = Math.sin(latA * this.PI / 180.) * Math.sin(latB * this.PI / 180.);
		var s = x + y;
		if (s > 1) s = 1;
		if (s < -1) s = -1;
		var alpha = Math.acos(s);
		var distance = alpha * earthR;
		return distance;
	},


	// qq:-0.0018754610010230112
	// z:0.9999982413235323
	// y:0.26905994701048397
	// distance:10215.42655780028


	// x/y:0.9999982413235323
	// z:0.0005969777777760132
	// y1:121.55974097777778
	// { lat: 31.245753, lng: 121.55974097777778 }

	//根据距离算出坐标（东西南北四个方向的坐标）
	distanceToDirectionPoint: function(latA, lngA, distance) {
		var earthR = 6371000.;
		var alpha = distance / earthR;
		var s = Math.cos(alpha);
		var x = s - Math.sin(latA * this.PI / 180.) * Math.sin(latA * this.PI / 180.);
		var y = Math.cos(latA * this.PI / 180.) * Math.cos(latA * this.PI / 180.);
		var z = (Math.acos(x / y)) * 180 / this.PI;
		var y1;
		var y2;
		if (lngA + z > lngA) {
			y1 = lngA + z;
			y2 = lngA - z;
		} else {
			y1 = lngA - z;
			y2 = lngA + z;
		}

		//Y方向
		var s1 = Math.sin(latA * this.PI / 180.) * Math.sin(latA * this.PI / 180.);
		var s2 = Math.cos(latA * this.PI / 180.) * Math.cos(latA * this.PI / 180.);
		var s4 = s * s * s1 + s2 - s * s;
		var s5 = s * Math.sin(latA * this.PI / 180.);
		var s6 = Math.sqrt(s4);
		var v5 = s5 + s6;
		var v6 = s5 - s6;
		var x1 = Math.asin(v5) * 180 / this.PI;
		var x2 = Math.asin(v6) * 180 / this.PI;
		if (x1 < latA) {
			var x3 = x2;
			x2 = x1;
			x1 = x3;
		}
		return {
			"east": {
				'lat': latA,
				'lng': y1
			},
			"south": {
				'lat': x2,
				'lng': lngA
			},
			"west": {
				'lat': latA,
				'lng': y2
			},
			"north": {
				'lat': x1,
				'lng': lngA
			}
		};

	},

	distanceToBoundaryMaxMin: function(latA, lngA, distance) {
		var op = this.distanceToDirectionPoint(latA, lngA, distance);
		return {
			minLat: op.south.lat,
			maxLat: op.north.lat,
			minLng: op.west.lng,
			maxLng: op.east.lng
		}
	},

	outOfChina: function(lat, lng) {
		if (lng < 72.004 || lng > 137.8347)
			return true;
		if (lat < 0.8293 || lat > 55.8271)
			return true;
		return false;
	},
	transformLat: function(x, y) {
		var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
		ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
		ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0 * this.PI)) * 2.0 / 3.0;
		ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y * this.PI / 30.0)) * 2.0 / 3.0;
		return ret;
	},
	transformLng: function(x, y) {
		var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
		ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
		ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0 * this.PI)) * 2.0 / 3.0;
		ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x / 30.0 * this.PI)) * 2.0 / 3.0;
		return ret;
	},

	getGrids: function(minLng, minLat, maxLng, maxLat, distance) {
		var lng = minLng;
		var lngArr = [lng];

		while (lng <= maxLng) {
			var pt = this.distanceToDirectionPoint(minLat, lng, distance)
			var north = pt.north;
			var east = pt.east;
			lng = east.lng
			lngArr.push(lng);
		}

		var lat = minLat;
		var latArr = [lat];

		while (lat <= maxLat) {
			var pt = this.distanceToDirectionPoint(lat, minLng, distance)
			var north = pt.north;
			var east = pt.east;
			lat = north.lat
			latArr.push(lat);
		}
		//console.log(lngArr.length);
		//console.log(latArr.length);

		var points = [];
		for (let i = 0; i < lngArr.length - 1; i++) {
			for (let j = 0; j < latArr.length - 1; j++) {
				var arr = [];
				arr.push([lngArr[i], latArr[j]]);
				arr.push([lngArr[i], latArr[j + 1]]);
				arr.push([lngArr[i + 1], latArr[j + 1]]);
				arr.push([lngArr[i + 1], latArr[j]]);

				var center = this.distanceToBoundaryMaxMin(latArr[j], lngArr[i], distance / 2)
				points.push({
					center: [center.maxLng, center.maxLat],
					grids: arr
				});
			}
		}
		return (points)

	},

	isPointInCircle: function(lat, lng, cLat, cLng, cDistance) {
		var dis = this.distance(lat, lng, cLat, cLng);
		if (dis <= cDistance) {
			return true;
		} else {
			return false;
		}
	},


	//pts [{lng,lat}]
	isPointInPolygon: function(lat, lng, pts) {
		var N = pts.length;
		var boundOrVertex = true; //如果点位于多边形的顶点或边上，也算做点在多边形内，直接返回true
		var intersectCount = 0; //cross points count of x 
		var precision = 2e-10; //浮点类型计算时候与0比较时候的容差
		var p1, p2; //neighbour bound vertices
		var p = {
			lat: lat,
			lng: lng
		}; //测试点

		p1 = pts[0]; //left vertex        
		for (var i = 1; i <= N; ++i) { //check all rays
			if (p.lat == p1.lat && p.lng == p1.lng) {
				//if (p.equals(p1)) {
				return boundOrVertex; //p is an vertex
			}

			p2 = pts[i % N]; //right vertex            
			if (p.lat < Math.min(p1.lat, p2.lat) || p.lat > Math.max(p1.lat, p2.lat)) { //ray is outside of our interests                
				p1 = p2;
				continue; //next ray left point
			}

			if (p.lat > Math.min(p1.lat, p2.lat) && p.lat < Math.max(p1.lat, p2.lat)) { //ray is crossing over by the algorithm (common part of)
				if (p.lng <= Math.max(p1.lng, p2.lng)) { //x is before of ray                    
					if (p1.lat == p2.lat && p.lng >= Math.min(p1.lng, p2.lng)) { //overlies on a horizontal ray
						return boundOrVertex;
					}

					if (p1.lng == p2.lng) { //ray is vertical                        
						if (p1.lng == p.lng) { //overlies on a vertical ray
							return boundOrVertex;
						} else { //before ray
							++intersectCount;
						}
					} else { //cross point on the left side                        
						var xinters = (p.lat - p1.lat) * (p2.lng - p1.lng) / (p2.lat - p1.lat) + p1.lng; //cross point of lng                        
						if (Math.abs(p.lng - xinters) < precision) { //overlies on a ray
							return boundOrVertex;
						}

						if (p.lng < xinters) { //before ray
							++intersectCount;
						}
					}
				}
			} else { //special case when ray is crossing through the vertex                
				if (p.lat == p2.lat && p.lng <= p2.lng) { //p crossing over p2                    
					var p3 = pts[(i + 1) % N]; //next vertex                    
					if (p.lat >= Math.min(p1.lat, p3.lat) && p.lat <= Math.max(p1.lat, p3.lat)) { //p.lat lies between p1.lat & p3.lat
						++intersectCount;
					} else {
						intersectCount += 2;
					}
				}
			}
			p1 = p2; //next ray left point
		}

		if (intersectCount % 2 == 0) { //偶数在多边形外
			return false;
		} else { //奇数在多边形内
			return true;
		}
	}
};



module.exports = GPS


//console.log(GPS.distanceToDirectionPoint(31.210245, 121.533546, 3000))
//console.log(GPS.distanceToBoundaryMaxMin(31.210245, 121.533546, 3000))

// 31.237224
// 31.183265
// 121.565091
// 121.502000
// 
// 
// 31.201251
// 31.219238
// 121.544061
// 121.523030
// 
// 31.165278
// 31.255211
// 121.586121
// 121.480970
// 
// db.brand_sanlin.updateMany({"location.lat": {"$gte" : 31.183265, "$lte" : 31.237224},"location.lng": {"$gte" : 121.502000, "$lte" : 121.565091}},{$set:{
//     subDistrict:"三林",
//     distance:3000}
// })