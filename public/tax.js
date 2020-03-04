var txt = "";
let nodes = document.evaluate("//span[contains(@class, 'visually-hidden')]", document, null, XPathResult.ANY_TYPE, null );
var result = nodes.iterateNext();
        while (result) {
            txt += result.childNodes[0].nodeValue + "<br>";
            result = nodes.iterateNext();
}
alert(txt);