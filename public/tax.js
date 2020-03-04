
const formatter = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
});

const textToValue = function(text) {
    return text.trim().replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/,/g, '');
  //return text.replace(/\n/g, '').replace(/\t/g, '').replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/,/g, '');
};

var product_path = null;
var prduct_price = null;
var tax = -1;
var root_query = null;
var text = null;
var text_nodes = null;
var n = null;
var text_value = null;
for (let i = 0; i < 1; i++) {
  /* -- Key data for products -- */
  product_path = '/products/%E5%95%86%E5%93%81%EF%BC%91';
  prduct_price = '¥1,000';
  tax = 1 + (parseInt('10') * 0.01);

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
        `${text}  税込：${formatter.format(parseInt(text_value) * tax)}`;
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
           `${text}  税込：${formatter.format(parseInt(text_value) * tax)}`;
      }
  }
}


