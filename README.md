# Shopify product tax reflection app as developer tutorial
This is Shoppify app for adding total price to the product top pages including tax which is not supported by Shopify natively, and 
also works as developer tutorial sample as all-in-one code not only for the app fucntion above but for other major API/SDK/Theme usage.

# How to run
Just pushing to heroku with the following system variables is the easiest way to run, or npm start locally maybe.

SHOPIFY_API_KEY:        YOUR_API_KEY

SHOPIFY_API_PERMISSION: read_products,write_products,read_script_tags,write_script_tags

SHOPIFY_API_SECRET:     YOUR_API_SECRET

SHOPIFY_API_VERSION:    2020-01

SHOPIFY_MONGO_DB_NAME:  YOUR_DB_NAME

SHOPIFY_MONGO_URL:      mongodb://YOUR_ID:YOUR_PASSWORD@YOUR_DOMAIN:YOUR_PORT/YOUR_DB_NAME

# Installation Endpoint
`https://YOUR_SHOP_DOAMIN/admin/oauth/authorize?client_id=YOUR_API_KEY&scope=ead_products,write_products,read_script_tags,write_script_tags&redirect_uri=https://YOUR_APP_DOMAIN_LIKE_HEROKU/callback&state=&grant_options[]=` 

(By OAuth endpopint described in the developer contents. See `https://shopify.dev/tutorials/authenticate-with-oauth`)

-- OR --

`https://YOUR_APP_DOMAIN_LIKE_HEROKU/auth?shop=YOUR_SHOP_DOAMIN` 

(By CDN App Bridge. See `https://shopify.dev/tools/app-bridge/getting-started`)

# TIPS
## how to be multilingiual app
Simply use `locale` parameter give by Shopify admin and how to be multilingual is totally up to you. 
In this sample, see `/i18n.js` and use `top.html`.
