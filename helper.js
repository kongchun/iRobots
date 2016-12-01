var Helper = {
	iteratorArr: function(arr, promiseCallback) {
		var it = arr[Symbol.iterator]();
		var list = [];
		return (function iterator(item) {
			if (item.done) {
				return Promise.resolve(list);
			}
			return promiseCallback(item.value).then((value) => {
				return list.push(value);
			}).then(() => {

				return iterator(it.next());
			}).catch(Promise.reject)
		})(it.next())
	},

	iteratorArrAsync: function(arr, promiseCallback) {
		var promises = arr.map(promiseCallback);
		return Promise.all(promises)
	}
}


module.exports = Helper;


Helper.iteratorArrAsync([1, 2, 3], function(i) {
	return Promise.resolve(++i);
}).then(function(arr) {
	console.log(arr);
})