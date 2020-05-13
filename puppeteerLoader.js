
const puppeteer = require('puppeteer');
let browser =null;
let page = null;

async function  init(){
	if(page==null){
		 browser = await puppeteer.launch({
			args: [
				'--no-sandbox'
			],
			executablePath: 'C:/Users/kongchun/AppData/Local/Google/Chrome/Application/chrome.exe',
			//ignoreHTTPSErrors: true,
			//devtools: true,
			headless: false
			//dumpio: false,
			//isMobile: true 
		  });
		page = await browser.newPage();
		await page.evaluateOnNewDocument(() => {
			var attr = window.navigator, result = [];
			do {
				Object.getOwnPropertyNames(attr).forEach(function (a) {
					result.push(a)
				})
			} while (attr = Object.getPrototypeOf(attr));
	
			Object.defineProperty(navigator, 'webdriver', {
				get: () => false,
			  });
	
			window.navigator.chrome = {
				runtime: {},
				loadTimes: function () { },
				csi: function () { },
				app: {}
			};
		});
	}
}

var get = async function(url,wait=1000) {
	await init();
	//await page.emulate(devices['iPhone 8'])
	await page.goto(url,{
		waitUntil: 'networkidle2'
	});
	await page.waitFor(wait);
	let content = await page.content();
	
	let arr = await page.cookies();
	let co = [];
	arr.forEach((t)=>{
		co.push(t.name+"="+t.value)
	})
	
	let cookie = (co.join(";"))

	//console.log({content,cookie,url});
	return {content,cookie,url};
};

var getCookie =  async function(url,wait){
	
	let  v = await getOnce(url,wait);
	return v.cookie;

}

var browserClose = function(url){
	browser && browser.close();
	console.log("browserClose");
}

var getOnce = async function(url,wait){
	let t = await get(url,wait);
	browserClose();
	return t;
}
var cheerio = require('cheerio');
var parseHTML = function(html) {
	var dom = cheerio.load(html, {
		withDomLvl1: true,
		normalizeWhitespace: true,
		xmlMode: false,
		decodeEntities: false
	});
	return dom;
}


var Loader = {
	get: get,
	getOnce:getOnce,
	getCookie:getCookie,
	close:browserClose
}




module.exports = Loader;