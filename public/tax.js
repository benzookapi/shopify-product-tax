let product = document.querySelector("a[href$='/products/%E5%95%86%E5%93%81%EF%BC%91']");
alert(product.innerHTML);
let price = document.evaluate("//*[contains(text(), '¥1,000')]", product, null, XPathResult.ANY_TYPE, null );
alert(price.innerHTML);