const DATA_KEY = 'ShopifyProductTaxAppDSata';

const addTax = function(proxy_res) {
  let formatter = new Intl.NumberFormat(proxy_res.locale, {
    style: 'currency',
    currency: proxy_res.currency
  });

  let textToValue = function(text) {
    return text.trim().replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/\$/g, '').replace(/,/g, '');
  };  

  let tax = 1 + parseFloat(proxy_res.tax);
  console.log(tax);

  let label = proxy_res.locale === 'ja-JP' ? '税込' : 'Tax included';

  let current_path = window.location.pathname;
  console.log(current_path);

  var p = null;
  var v = null;
  var xpath = null;
  var nodes = null;    
  var f = -1;
  var t = "";
  var n = null;
  let pSize = proxy_res.products.length;
  var vSize = -1;
  for (let i=0; i<pSize; i++) {
    p = proxy_res.products[i];
    console.log(p.handle);
    vSize = p.variants.length;
    for (let k =0; k<vSize; k++) {
      v = p.variants[k];
      console.log(v.id);
      console.log(v.price);
      /* -- Top/Collection/Product page -- */  
      if (current_path == '/' || current_path.indexOf('collections/') > 0 || current_path.indexOf('products/') > 0) {
        xpath = `//p[contains(., '${v.price}')]/text()|//span[contains(., '${v.price}')]/text()`;
        console.log(xpath);
        f = -1;
        t = "";
        nodes = window.document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
        while (n = nodes.iterateNext()) {
          console.log(`Node: ${n}`);
          t += n.nodeValue;
          console.log(t);
          console.log(textToValue(t));
          try {
            f = parseFloat(textToValue(t));
            if(!isNaN(f)) {
              n.nodeValue = `${formatter.format(f * tax)} (${label})`;
              break;
            }            
          } catch(error) {
            console.error(`error ${error}`);
          } 
        }           
      }
    }   
  }    
};

let stored_res = sessionStorage.getItem(DATA_KEY);
if (!stored_res) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let res = JSON.parse(this.responseText);
      sessionStorage.setItem(DATA_KEY, JSON.stringify(res));
      addTax(res); 
      //window.location.reload();
    }
  };
  /* --- Calling App proxies (https://shopify.dev/tutorials/display-data-on-an-online-store-with-an-application-proxy-app-extension) --- */
  xhttp.open("GET", "/apps/tax", true);
  xhttp.send();
} else {
  console.log(stored_res);
  addTax(JSON.parse(stored_res));  
}

/* -- For variant option change -- */
var path = window.location.pathname;
window.document.querySelectorAll(".single-option-selector").forEach(s => {
  s.addEventListener(
    'change',
    function() { 
      if (window.location.pathname != path) {
        window.location.reload();
      }
     },
    false
  );
});






