'use strict';

const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./domains.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

// const urls = ['http://www.mirror.co.uk/', 
// 	''
// ];

// const domainMap = {

// };


db.getAsync = function(query) {
  return new Promise((resolve, reject) => this.get(query, function (err) {
    if (err) {
      reject(err)
    } else {
      resolve(this)
    }
  }))
}


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
        let qDomain;
        let owner;

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
                let qDomain = domain.match(/([^.]+\.(?:com|co\.uk|net|io|org))$/)[1];
                let sql = "SELECT domain, owner FROM domains WHERE domain LIKE '%" + qDomain + "%'";
                
                db.get(sql, [], (err, row) => {
                    if (err) {
                        throw err;
                    }
                    owner = parseResult(row);
                    console.log(coreDomain + "\t" + domain + "\t" + url + "\t" + owner);
                });

            } catch (err) {

            }
        }
        request.continue();
    });
    await page.goto(reqUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'news.png', fullPage: true });


    await browser.close();
})();

function parseResult(row) {
    try {
        return row.owner;
    } catch (err) {
        return 'no match';
    }   
}