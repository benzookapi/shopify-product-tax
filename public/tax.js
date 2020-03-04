let nodes = document.evaluate("//a[contains(@href, '/products/%E5%95%86%E5%93%81%EF%BC%91')]//*[@class='grid-link__meta']/text()", 
  document, null, XPathResult.ANY_TYPE, null );
var price = nodes.iterateNext().nodeValue.replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '');
alert(price);