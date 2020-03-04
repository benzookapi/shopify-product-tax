# Shopify product tax reflection app

# How to run
TBD


# Installation Endpoint
`https://junichiokamurasptest1.myshopify.com/admin/oauth/authorize?client_id=232caee10aace6b3f04bee91a4b5e3d0&scope=read_products&redirect_uri=https://shopify-product-tax.herokuapp.com/callback&state=&grant_options[]=` 
(By OAoth endpopint described in the developer contents. See `https://shopify.dev/tutorials/authenticate-with-oauth`)

OR

`https://shopify-product-tax.herokuapp.com/auth?shop=junichiokamurasptest1.myshopify.com` 
(By CDN Appbridge. See `https://shopify.dev/tools/app-bridge/getting-started`)

# TIPS
## how to be multilingiual app
Simply use `locale` parameter give by Shopify admin and how to be multilingual is totally up to you. 
In this sample, see `/i18n.js` and use `top.html`
