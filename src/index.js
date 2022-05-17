const cheerio = require("cheerio");
const request = require("request");
const URL = require("url-parse");

const args = process.argv.slice(2);
const startUrl = args[0];
const depth = args[1];
const url = new URL(startUrl);
const baseUrl = url.protocol + "//" + url.hostname;

let results = [];
let pagesVisited = {};
let numPagesVisited = 0;
let pagesToVisit = [];

pagesToVisit.push(startUrl);

const crawl = () => {
  if (numPagesVisited >= depth) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  let nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
  console.log(results);
};

const visitPage = (url, callback) => {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  request(url, function (error, response, body) {
    if (error) {
      console.log("Error: " + error);
    }
    // Check status code (200 is HTTP OK)
    console.log("Status code: " + response.statusCode);
    if (response.statusCode !== 200) {
      callback();
      return;
    }
    // Parse the document body
    const $ = cheerio.load(body);
    collectInternalImages($, url);
    collectInternalLinks($);
    callback();
  });
};

const collectInternalLinks = ($) => {
  const relativeLinks = $("a[href^='/']");
  console.log("Found " + relativeLinks.length + " relative links on page");
  relativeLinks.each(function () {
    pagesToVisit.push(baseUrl + $(this).attr("href"));
  });
};

const collectInternalImages = ($, url) => {
  const relativeLinksImages = $("img[src^='/']");
  relativeLinksImages.each(function () {
    results.push({
      imageUrl: baseUrl + $(this).attr("src"),
      sourceUrl: url,
      depth: numPagesVisited,
    });
  });
};

crawl();
