var txt = "";
let nodes = document.evaluate("//a[contains(@href, '/products/%E5%95%86%E5%93%81%EF%BC%91')]//*[contains(., '¥1,000')]", 
  document, null, XPathResult.ANY_TYPE, null );
txt = nodes.iterateNext().textContent;
  /*      while (result) {
            txt += result.textContent;
            result = nodes.iterateNext();
}*/
txt = txt.replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '');
alert(txt);

let nodes2 = document.evaluate("//a[contains(@href, '/products/%E5%95%86%E5%93%81%EF%BC%91')]//*[contains(., '¥1,000')]", 
  document, null, XPathResult.ANY_TYPE, null );
var result2 = nodes2.iterateNext();
result2.textContent = "222222";



