var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {

    let proxy_res = JSON.parse(this.responseText);

    let formatter = new Intl.NumberFormat(proxy_res.locale, {
      style: 'currency',
      currency: proxy_res.currency
    });

    let textToValue = function(text) {
      return text.trim().replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/\$/g, '').replace(/,/g, '');
    };  

    let tax = 1 + parseFloat(proxy_res.tax);
    console.log(JSON.stringify(tax));
    let label = proxy_res.locale === 'ja-JP' ? '税込' : 'Tax included';

    var product_path = null;
    var prduct_price = null;    
    var xpath = null;
    var text = null;
    var nodes = null;
    var n = null;
    var f = null;
    proxy_res.products.forEach(p => {

      /* -- Key data for products -- */
      product_path = `/products/${p.handle}`;
      prduct_price = `${p.price}`;      

      console.log(JSON.stringify(product_path));
      console.log(JSON.stringify(prduct_price));      
        
      /* -- Top page -- */
      if (window.location.pathname == "" || window.location.pathname.indexOf('collections/') > 0) {
        xpath = `//span[contains(., '${prduct_price}')]`;
        text = "";
        f = -1;
        nodes = document.evaluate(`${xpath}`, document, null, XPathResult.ANY_TYPE, null);
        console.log(JSON.stringify(nodes));
        n = nodes.iterateNext();        
        while (n) {
          console.log(JSON.stringify(n));
          text += n.childNodes[0].nodeValue;
          try {
            f = parseFloat(textToValue(text));
            break;
          }
          catch(error) {
            //console.error(error);
            console.log(text);
          }         
          n = nodes.iterateNext();
        }
        if (f != -1) {
          document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent = 
            `${formatter.format(f * tax)} (${label})`;
        }
      }
        
      /* -- Product page -- */
      if (window.location.pathname.endsWith(product_path)) {
        xpath = `//span[contains(., '${prduct_price}')]`;
        text = "";
        f = -1;
        nodes = document.evaluate(`${xpath}`, document, null, XPathResult.ANY_TYPE, null);
        console.log(JSON.stringify(nodes));
        n = nodes.iterateNext();
        while (n) {
          console.log(JSON.stringify(n));
          text += n.childNodes[0].nodeValue;
          try {
            f = parseFloat(textToValue(text));
            break;
          }
          catch(error) {
            //console.error(error);
            console.log(text);
          } 
          n = nodes.iterateNext();
        }
        if (f != -1) {
          document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent = 
            `${formatter.format(f * tax)} (${label})`;
        }
      }

    });        

  }
};
xhttp.open("GET", "/apps/tax", true);
xhttp.send();





