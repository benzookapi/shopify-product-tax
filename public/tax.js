var txt = "";
let nodes = document.evaluate("//a[contains(@href, '/products/%E5%95%86%E5%93%81%EF%BC%91')]//text()", 
  document, null, XPathResult.ANY_TYPE, null );
var result = nodes.iterateNext();
        while (result) {
            txt += result.nodeValue; + "AAA";
            result = nodes.iterateNext();
}
txt = txt.replace(/' '/g, '').replace(/"/g, '').replace(/'/g, '');
alert(txt);