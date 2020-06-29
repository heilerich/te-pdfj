document.querySelector('#pdfTocToggle').click();

function sleep(milliseconds) {
   return new Promise(resolve => setTimeout(resolve, milliseconds));
}

var el = document.createElement("script")
; el.src = 'https://unpkg.com/nprogress@0.2.0/nprogress.js'
; document.body.appendChild(el);
var el = document.createElement("link")
; el.href = 'https://unpkg.com/nprogress@0.2.0/nprogress.css'; el.rel = 'stylesheet' ;
; document.head.appendChild(el);

var el = document.createElement("script")
; el.src = 'https://cdn.jsdelivr.net/npm/socket.io-client@2/dist/socket.io.js'
; document.head.appendChild(el)

await sleep(2000);



var mergePdfs = async function(pdfsToMerge) {
  const socket3 = io('wss://3000-a94c551c-95e9-412d-92c7-2a28eee5a78e.ws-eu01.gitpod.io/');
  const filename = (new URL(location.href)).pathname.split('/').pop();
  NProgress.start();
  var i = 0;
  var merge = async function(pdfCopyDoc, i) {
    const pdfBytes = await fetch(pdfCopyDoc).then(res => res.arrayBuffer());
    await new Promise((resolve) => {
        socket3.binary(true).emit('pdfpart', filename, pdfBytes, i, ack => resolve());
    });
    NProgress.set(i / pdfsToMerge.length);
  }
  await Promise.all(pdfsToMerge.map((ele, index) => merge(ele, index)));
  NProgress.done();
  socket3.emit('pdfget', filename, pdfsToMerge.length-1);
  return filename;
}

NProgress.configure({ trickle: false });

var links = Array.from(document.querySelectorAll("a[data-pdf-link]")).map(el => 'https://eref.thieme.de' + el.dataset.pdfLink);
var pdf = await mergePdfs(links);