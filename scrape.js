const puppeteer = require('puppeteer');
const fs = require('fs');

// const BASE_URL = 'https://www.thegearpage.net/board/index.php?threads/show-your-pedalboard-2023.2425275/';
const BASE_URL = 'https://www.thegearpage.net/board/index.php?threads/show-your-pedalboard-2022.2318077/';

async function getPageCount(browser) {
  console.log(`getting total number of pages...`)
  const page = await browser.newPage();

  await page.goto(BASE_URL, {timeout: 0, waitUntil: 'networkidle0'});

  const pageCount = await page.$eval('ul.pageNav-main', ul => {
    return ul.querySelector('li:last-child').textContent;
  });

  page.close();

  console.log(`Total thread page count: ${pageCount}`);

  return pageCount;
}

async function getImageUrls(browser, pageNumber) {
  try {
    console.log(`fetching image URLs for page ${pageNumber}...`);
    const page = await browser.newPage();
    const pageUrl = `${BASE_URL}page-${pageNumber}#posts`;

    await page.goto(pageUrl, {timeout: 0, waitUntil: 'networkidle0'});

    const images = await page.$$eval('div.bbImageWrapper > img', images => {
      return images.map(image => image.src)
    });

    page.close();

    console.log(`page ${pageNumber} done!`);

    return images;
  } catch (error) {
    console.error(`An error occured while saving image urls in page ${pageNumber}: ${error}`);
  }
}

async function saveImage(browser, {url, index, pageNumber}) {
  try {
    console.log(`saving image: ${index}...`);
    const IMAGE_PATH = './2022/images';
    const page = await browser.newPage();
    const response = await page.goto(url, {timeout: 0, waitUntil: 'networkidle0'})
    const imageBuffer = await response.buffer();
    const pageDir = `${IMAGE_PATH}/page-${pageNumber}`;

    if (!fs.existsSync(pageDir)){
      fs.mkdirSync(pageDir);
    }

    await fs.promises.writeFile(`${pageDir}/${index}.png`, imageBuffer);

    console.log(`${index}.png saved!`);

    await page.close();
  } catch (error) {
    console.error(`An error occured while saving image number ${index}: ${error}`);
  }
}

async function updateMasterList(updatedList) {
  const filePath = './masterList.json';

  try {
    await fs.promises.writeFile(filePath, JSON.stringify(updatedList));
  } catch (error) {
    console.error(`An error occured while updating image masterlist: ${error}`);
  }
}

async function retrieveMasterList() {
  const filePath = './masterList.json';

  if (fs.existsSync(filePath)) {
    try {
      const list = await fs.promises.readFile(filePath, 'utf-8');

      return JSON.parse(list);
    } catch (error) {
      console.error(`An error occured while trying to read image master list json file: ${error}`);
    }
  }

  return [];
}

async function updatePageImageList(updatedList) {
  const filePath = './pageImages.json';

  try {
    await fs.promises.writeFile(filePath, JSON.stringify(updatedList));
  } catch (error) {
    console.error(`An error occured while updating page image list: ${error}`);
  }
}

async function retrievePageImageList() {
  const filePath = './pageImages.json';

  if (fs.existsSync(filePath)) {
    try {
      const list = await fs.promises.readFile(filePath, 'utf-8');

      return JSON.parse(list);
    } catch (error) {
      console.error(`An error occured while trying to read page image list json file: ${error}`);
    }
  }

  return [];
}

function pageExists(page, list) {
  return list.some(item => item.page === page);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  try {
    const pageCount = await getPageCount(browser);

    //stopped at page42
    for (let page = 103; page <= pageCount; page++) {
      let images = await getImageUrls(browser, page);
      const masterList = await retrieveMasterList();
      const pageImageList = await retrievePageImageList();

      images = [...new Set(images)];
      images = images.filter(image => !masterList.includes(image));

      let imageRepository = [
        ...new Set(masterList),
        ...new Set(images),
      ];

      const indexedImages = images.map((url, i) => ({
        index: i+1,
        url,
        pageNumber: page,
      }));

      for (const imageData of indexedImages) {
        // await saveImage(browser, imageData);
      }

      let updatedPageImageList = pageExists(page, pageImageList)
        ? [...pageImageList]
        : [
          ...pageImageList,
          {
            page,
            images,
          }
        ]

      await updateMasterList(imageRepository);
      await updatePageImageList(updatedPageImageList);
    }
  } catch (error) {
    console.error(`An error occured in main: ${error}`)
  } finally {
    browser.close();
  }
})();
