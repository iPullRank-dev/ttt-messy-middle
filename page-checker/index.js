const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

function getTitle() {
  if (document.querySelector("title")) {
    return document.querySelector("title").text;
  }
  return "";
}

function getDescription() {
  if (document.querySelector('meta[name="description"]')) {
    return document.querySelector('meta[name="description"]').content;
  }
  return "";
}

const PUPPETEER_OPTIONS = {
  headless: true,
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-first-run",
    "--no-sandbox",
    "--no-zygote",
    "--single-process",
    "--deterministic-fetch",
    "--blink-settings=imagesEnabled=false",
  ],
};

const openConnection = async () => {
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
  );
  await page.setViewport({ width: 1680, height: 1050 });
  return { browser, page };
};

const closeConnection = async (page, browser) => {
  page && (await page.close());
  browser && (await browser.close());
};

exports.pageChecker = async (req, res) => {
  let { browser, page } = await openConnection();
  try {
    let url = req.query.url || "";
    if (url == "") {
      res.status(403).send({ message: "No Url" });
    }

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    const title = await page.evaluate(getTitle);
    const description = await page.evaluate(getDescription);

    res.status(200).send({ title: title, description: description });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await closeConnection(page, browser);
  }
};
