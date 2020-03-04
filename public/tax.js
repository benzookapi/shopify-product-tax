var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    let proxy_res = JSON.parse(this.responseText);
    let formatter = new Intl.NumberFormat(proxy_res.locale, {
      style: 'currency',
      currency: proxy_res.currency
    });
    let textToValue = function(text) {
      return text.trim().replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/,/g, '');
    };  
    var product_path = null;
    var prduct_price = null;
    var tax = -1;
    var root_query = null;
    var text = null;
    var text_nodes = null;
    var n = null;
    var text_value = null;
    var label = proxy_res.locale == 'ja-JP' ? '税込' : 'Tax included';
    proxy_res.products.forEach(p => {
      /* -- Key data for products -- */
      product_path = `/products/${p.handle}`;
      prduct_price = `${p.price}`;
      tax = 1 + parseInt(proxy_res.tax);
        
      /* -- Top page -- */
      root_query = `//a[contains(@href, '${product_path}')]//*[contains(., '${prduct_price}')]`;
      text = "";
      text_nodes = document.evaluate(`${root_query}/text()`, document, null, XPathResult.ANY_TYPE, null);
      n = text_nodes.iterateNext();
      while (n) {
        text += n.nodeValue;
        n = text_nodes.iterateNext();
      }
      text_value = textToValue(text);
      if (text_value != "") {
        document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent = 
          `${text} ${label}: ${formatter.format(parseInt(text_value) * tax)}`;
      }
        
      /* -- Product page -- */
      if (window.location.pathname.endsWith(product_path)) {
        root_query = `//span[contains(., '${prduct_price}')]`;
        text = "";
        text_nodes = document.evaluate(`${root_query}/text()`, document, null, XPathResult.ANY_TYPE, null);
        n = text_nodes.iterateNext();
        while (n) {
          text += n.nodeValue;
          n = text_nodes.iterateNext();
        }
        text_value = textToValue(text);
        if (text_value != "") {
          document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent = 
            `${text} ${label}: ${formatter.format(parseInt(text_value) * tax)}`;
        }
      }
    });        
  }
};
xhttp.open("GET", "apps/tax", true);
xhttp.send();





