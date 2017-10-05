'use strict';

const puppeteer = require('puppeteer');

// const urls = ['http://www.mirror.co.uk/', 
// 	''
// ];

// const domainMap = {

// };


const reqUrl = 'http://www.mirror.co.uk/';
const coreDomain = reqUrl.match(/^https?:\/\/(?:www\.)?([^\/]+)/)[1];

console.log("Fetching " + reqUrl + " - core domain: " + coreDomain);

(async() => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setRequestInterceptionEnabled(true);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.91 Safari/537.36');
    page.on('request', request => {
    	let re1 = new RegExp('^https?://([^/]+)?' + coreDomain + '/.*?\.js.*$', 'i');
    	let re2 = new RegExp('^https?://([^/]+)?' + coreDomain + '/', 'i');

    	const url = request.url;
    	let domain;

        if (!/^https?:\/\//i.test(request.url)) {
        	// do nothing (ie data:image)
        } else if (re1.test(request.url)) {
            try {
                domain = url.match(/^https?:\/\/([^\/]+)\//i)[1];
            } catch (err) {
                
            }
            console.log(coreDomain + "\t" + domain + "\t" + url);
        } else if (re2.test(request.url)) {
            // request for js resource
            // console.log(request.url);
        } else {
            try {
                domain = url.match(/^https?:\/\/([^\/]+)\//i)[1];
            } catch (err) {
                
            }
            console.log(coreDomain + "\t" + domain + "\t" + url);
        }
        request.continue();
    });
    await page.goto(reqUrl, { waitUntil: 'networkidle' });
    await page.screenshot({path: 'news.png', fullPage: true});


    await browser.close();
})();