
let root_query = "//a[contains(@href, '/products/%E5%95%86%E5%93%81%EF%BC%91')]//*[contains(., '¥1,000')]";

var price_text = "";
var text_nodes = document.evaluate(`${root_query}/text()`, document, null, XPathResult.ANY_TYPE, null);
var n = text_nodes.iterateNext();
while (n) {
    price_text += n.nodeValue;
    n = text_nodes.iterateNext();
}
price_text = price_text.replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/,/g, '');
alert(price_text);

document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent = parseInt(price_text) + 333;


