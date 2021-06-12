const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const querystring = require("querystring");

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());



async function autoScroll(page){
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if(totalHeight >= scrollHeight){
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

app.post("/render", async (req, res) => {
  let url = req.body.url;
  let waitForXPath = req.body.waitForXPath;

  if (!url) return res.send("Error: Invalid URL");

  console.info("Rendering " + url);

  try {

    let browser = await puppeteer.launch({
      headless: false
    });

    let page = await browser.newPage();

    await page.setViewport({
      width: 1920,
      height: 1080
    });

    
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['font'].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    await page.goto(url);

    await page.evaluate(() => {

    })

    try {
      await page.waitForXPath(waitForXPath, {
        timeout: 10000
      });
    } catch (e) {
      console.info("Request to " + url + " timed out!");

      await page.close();
      await browser.close();

      res.send("Error: Timed out");
      return;
    }

    await autoScroll(page);

    let content = await page.content();

    await page.close();
    await browser.close();

    res.send(content);
  } catch (e) {
    console.info("Error rendering page: ", e);
    res.send("Error: " + e);
  }

});

app.listen(3001, () => {
  console.info("Server running on port 3001");
});