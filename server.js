const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const app = express();
const PORT = 8080;

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.static(__dirname))

app.get('/', (req, res) => {
  res.send('Pedalboards')
});

app.get('/2022', (req, res) => {
  res.sendFile(path.join(__dirname, '/2022/index.html'));
});

app.get('/2022/pages.json', async (req, res) => {
  const pages = await fs.promises.readdir(path.join(__dirname, '2022/images/'));
  let pageData = [];

  for (let page = 1; page <= pages.length; page++) {
    const images = await fs.promises.readdir(path.join(__dirname, `2022/images/page-${page}`));

    pageData = [
      ...pageData,
      {
        page: page,
        images,
      }
    ]
  }

  res.json({
    totalPageCount: pages.length,
    pageData,
  });
});

app.listen(PORT, () => {
  console.log(`app running in port ${PORT}`);
})