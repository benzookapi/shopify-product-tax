

/* -- Key data for products -- */
var product_path = '/products/%E5%95%86%E5%93%81%EF%BC%91';
var prduct_price = '¥1,000';
var tax = 1 + (parseInt('10') * 0.01);

/* -- Top page -- */
var root_query = `//a[contains(@href, '${product_path}')]//*[contains(., '${prduct_price}')]`;
var text = "";
var text_nodes = document.evaluate(`${root_query}/text()`, document, null, XPathResult.ANY_TYPE, null);
var n = text_nodes.iterateNext();
while (n) {
    text += n.nodeValue;
    n = text_nodes.iterateNext();
}
text = price_text.replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/,/g, '');
if (text != "") {
    document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent = parseInt(text) * tax;
}

/* -- Product page -- */
if (window.location.pathname.endsWith(product_path)) {
    root_query = `//*[@id='ProductPrice']`;
    text = "";
    text_nodes = document.evaluate(`${root_query}/text()`, document, null, XPathResult.ANY_TYPE, null);
    n = text_nodes.iterateNext();
    while (n) {
        text += n.nodeValue;
        n = text_nodes.iterateNext();
    }
    text = price_text.replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '').replace(/,/g, '');
    if (text != "") {
        document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent = parseInt(text) * tax;
    }
}



