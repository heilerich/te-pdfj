const io = require('socket.io')(3000);
const pdflib = require('pdf-lib');
const http = require('http');
const url = require('url');

const files = {};
const savedFiles = {};

io.on('connect', socket => {
  socket.on('pdfpart', async (filename, part, number, callback) => {
    console.log(`Receive part ${number} of ${filename}`)

    if (files[filename] == undefined) {
        files[filename] = {};
    }

    const pdf = await pdflib.PDFDocument.load(part);
    files[filename][number] = pdf;

    callback(0);
  });

  socket.on('pdfget', async (filename, lastNumber) => {
    console.log(`Saving ${filename} (${lastNumber})`)
    
    const mergedPdf = await pdflib.PDFDocument.create();

    for (var i = 0; i <= lastNumber; i++) {
        const pdf = files[filename][i];
        console.log(`Merging ${filename} (${i}/${lastNumber})`)
        if (pdf != undefined) {
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        } else { console.log(`No page ${i}`); }
    }
    files[filename] = null;
    savedFiles[filename] = await mergedPdf.save();
  });
});

const server = http.createServer((req, res) => {
  const filename = url.parse(req.url).pathname.split('/').pop();
  if (savedFiles[filename] != undefined) {
    res.statusCode = 200;
    res.setHeader( 'Content-Type', 'application/pdf;base64' );
    res.setHeader( 'Content-Disposition' , `inline; filename="${filename}.pdf"`)
    res.write(Buffer.from(savedFiles[filename].buffer));
  } else {
      res.statusCode = 404;
  }
  res.end();
});

const port = 5000;
const hostname = '127.0.0.1';

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});