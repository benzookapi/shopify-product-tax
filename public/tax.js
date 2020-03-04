let product = document.querySelector("a[href$='/products/%E5%95%86%E5%93%81%EF%BC%91']");
alert(product.innerHTML);
var txt = "";
let node = document.evaluate("//*[contains(text(), '¥1,000')]", document, null, XPathResult.ANY_TYPE, null );
var result = nodes.iterateNext();
        while (result) {
            txt += result.childNodes[0].nodeValue + "<br>";
            result = nodes.iterateNext();
}
alert(txt);