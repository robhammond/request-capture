const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterceptionEnabled(true);
  page.on('request', request => {
  if (/^https?:\/\/([^\/]+)?mirror\.co\.uk\//i.test(request.url)) {
	    // request for js resource
	    // console.log(request.url);
	  } else {
	  	console.log(request.url);
	  }
	  request.continue();
	});
  await page.goto('http://www.mirror.co.uk/', {waitUntil: 'networkidle'});
  

  await browser.close();
})();
