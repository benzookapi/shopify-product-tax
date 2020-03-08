const KEY_SHOP = 'ShopifyProductTaxAppShop';
const KEY_PRODUCTS = 'ShopifyProductTaxAppProducts';
const KEY_VARIANTS = 'ShopifyProductTaxAppVariants';

const textToValue = function(text) {
  return text.trim().replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/\$/g, '').replace(/,/g, '');
};  

const textToNumber = function(text) {
  return parseFloat(textToValue(text));
}

const getProxyData = function(data_key, data_id = null) {
  let cached_data = sessionStorage.getItem(data_key);
  var request = new XMLHttpRequest();
  if (data_id == null) {
    if (!cached_data) {
      /* --- Calling App proxies (https://shopify.dev/tutorials/display-data-on-an-online-store-with-an-application-proxy-app-extension) --- */
      request.open("GET", `/apps/tax?data_key=${data_key}`, false);      
      request.send();
      console.log(`/apps/tax?data_key=${data_key}`);
      if (request.status === 200) {
        console.log(request.responseText);
        let res = JSON.parse(request.responseText);
        sessionStorage.setItem(data_key, JSON.stringify(res));
        return res;
      }
    } else {
      return JSON.parse(cached_data);
    }    
  } else {
    let cache = JSON.parse(cached_data);
    if (typeof cache[data_id] === 'undefined') {
      request.open("GET", `/apps/tax?data_key=${data_key}&data_id=${data_id}`, false);      
      request.send();
      console.log(`/apps/tax?data_key=${data_key}&data_id=${data_id}`);
      if (request.status === 200) {
        console.log(request.responseText);
        let res = JSON.parse(request.responseText);        
        cache[data_id] = res;
        sessionStorage.setItem(data_key, JSON.stringify(cache));
        return cache[data_id];
      }
    } else {
      return cache[data_id];
    }
  }
};

const addTaxForAll = function(proxy_data) {
  //if (!proxy_data.isAll) return;

  console.log(JSON.stringify(proxy_data));
  console.log(proxy_data.locale);
  console.log(proxy_data.currency);

  let formatter = new Intl.NumberFormat(proxy_data.locale, {
    style: 'currency',
    currency: proxy_data.currency
  });

  let tax = 1 + parseFloat(proxy_data.tax);
  console.log(tax);

  let symbol = proxy_data.symbol;

  let searchAndUpdate = function() {
    let xpath = `//p[contains(., '${symbol}')]/text()|//span[contains(., '${symbol}')]/text()|//div[contains(., '${symbol}')]/text()`;
    console.log(xpath);
    var f = -1;
    var t = "";
    var reg = new RegExp(`${symbol}[0-9,\.]+`, 'g');
    var temp = "";
    nodes = window.document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    while (n = nodes.iterateNext()) {
      console.log(`Node: ${JSON.stringify(n)}`);
      t = n.nodeValue;
      console.log(t);
      console.log(textToValue(t));
      temp = t;
      while ((r = reg.exec(t)) != null) {
        console.log(r[0]);
        try {
          f = parseFloat(textToValue(r[0]));
          if(!isNaN(f)) {
            console.log(f);
            temp = temp.replace(r, formatter.format(f * tax));            
          }            
        } catch(error) {
          console.error(`error ${error}`);
        } 
      }
      if (temp != t) {        
        n.nodeValue = temp;
        console.log(n.nodeValue);
        return true;
      }
    }
    return false;  
  };
  
  while (searchAndUpdate()){
  }

  /* -- For variant option change -- */  
  let q = window.location.search;  
  window.document.querySelectorAll(".single-option-selector").forEach(s => {
    s.addEventListener(
      'change',
      function() { 
        if (window.location.search != q) {
          window.location.reload();
        }
      },
      false
    );
  });
  window.document.querySelectorAll(".single-option-selector__radio").forEach(s => {
    s.addEventListener(
      'change',
      function() { 
        if (window.location.search != q) {
          window.location.reload();
        }
      },
      false
    );
  });
  window.document.querySelectorAll(".variants").forEach(s => {
    s.addEventListener(
      'change',
      function() { 
        if (window.location.search != q) {
          window.location.reload();
        }
       },
      false
    );
  });

};

const addTax = function(price, product_id = null, variant_id = null) {
  let shop_proxy_data = getProxyData(KEY_SHOP);
  var proxy_data = {};
  if (product_id != null) {
    proxy_data = getProxyData(KEY_PRODUCTS, product_id);
  } else if (product_id != null) {
    proxy_data = getProxyData(KEY_VARIANTS, variant_id);
  }
  if (!proxy_data.taxable) return price;

  let tax = 1 + parseFloat(shop_proxy_data.tax);
  console.log(tax);
  let res = textToNumber(price) * tax;
  console.log(res);
  return res;
};

addTaxForAll(getProxyData(KEY_SHOP));


