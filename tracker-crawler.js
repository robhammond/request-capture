'use strict';

const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./domains.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(err.message);
    }
});
const fs = require('fs');
const tsv = './data/crawled-mirror.tsv';

fs.writeFile(tsv, "Source\tSub-Domain\tURL\tDomain\tName\n", (err) => {
    if (err) throw err;
});

const reqUrl = 'http://www.mirror.co.uk/';
const coreDomain = reqUrl.match(/^https?:\/\/(?:www\.)?([^\/]+)/)[1];

console.log("Fetching " + reqUrl + " - core domain: " + coreDomain);

(async() => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setRequestInterceptionEnabled(true);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.91 Safari/537.36');
    page.on('request', request => {
        let re1 = new RegExp('^https?://([^/]+)?' + coreDomain + '/.*?\.js.*$', 'i');
        let ignoreRE = new RegExp('^https?://([^/]+)?' + coreDomain + '/', 'i');

        const url = request.url;

        let owner;
        let domain;
        let qDomain;
        if (url.match(/^https?:\/\//i)) {
            try {
                domain = url.match(/^https?:\/\/([^\/]+)\//i)[1];
            } catch (err) {
                console.log("ERROR: Can't match domain on " + url);
            }
            try {
                // account for cse.google and whatever else they do
                if (domain.match(/^(.*?\.google\.(?:com|co\.uk|net|io|org|direct|tv|[tc]o|de))$/)) {
                    qDomain = domain;
                    qDomain = qDomain.replace('www.', '');
                } else {
                    qDomain = domain.match(/([^.]+\.(?:com|co\.uk|net|io|org|direct|tv|[tc]o|de))$/)[1];
                }

            } catch (err) {
                console.log("ERROR: Can't match qDomain on " + url);
            }

            if (!/^https?:\/\//i.test(request.url)) {
                // do nothing (ie data:image)
            } else if (re1.test(request.url)) { // internal JS files
                console.log(coreDomain + "\t" + domain + "\t" + url + "\t" + qDomain);
                let output = coreDomain + "\t" + domain + "\t" + url + "\t" + qDomain + "\n";
                fs.appendFile(tsv, output, (err) => {
                    if (err) throw err;
                });
            } else if (ignoreRE.test(request.url)) { // ignore other internal requests
            } else {
                try {
                    let sql = "SELECT domain, owner FROM domains WHERE domain LIKE '%" + qDomain + "%'";
                    db.get(sql, [], (err, row) => {
                        if (err) {
                            throw err;
                        }
                        owner = parseResult(row);
                        console.log(coreDomain + "\t" + domain + "\t" + url + "\t" + qDomain + "\t" + owner);

                        let output = coreDomain + "\t" + domain + "\t" + url + "\t" + qDomain + "\t" + owner + "\n";
                        fs.appendFile(tsv, output, (err) => {
                            if (err) throw err;
                        });
                    });

                } catch (err) {

                }
            }
        }
        request.continue();
    });
    // page.on('response', response => {
    //     console.log(response.url);
    //     console.log(response.headers);
    //     console.log(response.status);
    // });
    await page.goto(reqUrl, { waitUntil: 'networkidle' });
    

    // (function() { 
    //     var links = []; 
    //     for (let a of document.querySelectorAll('a')) { 
    //         if ((a.href != '') && (a.href != window.location)) { 
    //             links.push(a.href); 
    //         } 
    //     } 
    //     var rand = links[Math.floor(Math.random() * links.length)]; 
    //     return JSON.stringify({ 'link': rand }); 
    // }())

    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a');
      return [].map.call(anchors, a => a.href);
    });
    console.log(links);
    let rand = links[Math.floor(Math.random() * links.length)]; 
    await page.screenshot({ path: 'news.png', fullPage: true });
    console.log("now getting " + rand);

    await page.goto(rand, { waitUntil: 'networkidle' });

    await browser.close();
})();

function parseResult(row) {
    try {
        return row.owner;
    } catch (err) {
        return 'no match';
    }
}