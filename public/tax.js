
let root_query = "//a[contains(@href, '/products/%E5%95%86%E5%93%81%EF%BC%91')]//*[contains(., '¥1,000')]";

var org_price = document.evaluate(`${root_query}/text()`, document, null, XPathResult.ANY_TYPE, null ).iterateNext().nodeValue.
  replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '').replace(/¥/g, '');
alert(org_price);

document.evaluate(root_query, document, null, XPathResult.ANY_TYPE, null ).iterateNext().textContent = parseInt(org_price) + 333;


