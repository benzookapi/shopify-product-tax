'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaRequest = require('koa-http-request');
const views = require('koa-views');
const serve = require('koa-static');

const crypto = require('crypto');

const fs = require('fs');

const mongo = require('mongodb');

const router = new Router();
const app = module.exports = new Koa();

app.use(bodyParser());

app.use(koaRequest({
  
}));

app.use(views(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
}));

app.use(serve(__dirname + '/public'));

const API_KEY = `${process.env.SHOPIFY_API_KEY}`;
const API_SECRET = `${process.env.SHOPIFY_API_SECRET}`;
const API_PERMISSION = `${process.env.SHOPIFY_API_PERMISSION}`;
const API_VERSION = `${process.env.SHOPIFY_API_VERSION}`

const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';

const GRAPHQL_PATH_ADMIN = `admin/api/${API_VERSION}/graphql.json`;
const RESTAPI_PATH_ADMIN = `admin/api/${API_VERSION}`;

const UNDEFINED = 'undefined';

const HMAC_SECRET = API_SECRET;

// Mongo URL and DB name for date store
const MONGO_URL = `${process.env.SHOPIFY_MONGO_URL}`;
const MONGO_DB_NAME = `${process.env.SHOPIFY_MONGO_DB_NAME}`;
const MONGO_COLLECTION = 'shops';

// Set Timezone Japan
//process.env.TZ = 'Asia/Tokyo'; 

/* Test frontend React */
router.get('/react',  async (ctx, next) => { 
  console.log("+++++++++ /react ++++++++++");
  let shop = ctx.request.query.shop;
  await ctx.render('react', {
  });
});

/*
 *
 * --- Auth by frontend App Bridge ---
 *
*/
router.get('/auth',  async (ctx, next) => { 
  console.log("+++++++++ /auth ++++++++++");
  let shop = ctx.request.query.shop;
  await ctx.render('auth', {
    api_key: API_KEY,
    api_permission: API_PERMISSION,
    callback: `https://${ctx.request.hostname}/callback`,
    shop: shop
  });
});

/*
 *
 * --- Top ---
 *
*/
router.get('/',  async (ctx, next) => {  
  console.log("+++++++++ / ++++++++++");
  if (!checkSignature(ctx.request.query)) {
    ctx.status = 400;
    return;
  }

  let shop = ctx.request.query.shop;
  let locale = ctx.request.query.locale;

  var shop_data = await(getDB(shop)); 
  if (shop_data == null) {
    ctx.body = "No shop data";
  } else {
    let api_res = await(callGraphql(ctx, shop, `{
      shop {
        products(first: 100) {
          edges {
            node {
              id
              handle
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }`));
    console.log(`${JSON.stringify(api_res)}`);
    /*ctx.state = {
      session: this.session
    }; */ 
    await ctx.render('top', {
      name: api_res.data.shop.products.edges[0].node.handle,
      shop: shop,
      locale: locale,
      api_key: API_KEY
    });
  }
});

/* 
 *
 * --- Callback endpoint during the installation ---
 * 
*/
router.get('/callback',  async (ctx, next) => {
  console.log("+++++++++ /callback ++++++++++");
  if (!checkSignature(ctx.request.query)) {
    ctx.status = 400;
    return;
  }
  let req = {};
  req.client_id = API_KEY;
  req.client_secret = API_SECRET;
  req.code = ctx.request.query.code;

  let shop = ctx.request.query.shop;

  let res = await(accessEndpoint(ctx, `https://${shop}/admin/oauth/access_token`, req, null, CONTENT_TYPE_FORM)); 
  if (res.access_token !== UNDEFINED) {
    var shop_data = await(getDB(shop)); 
    if (shop_data == null) {
      await(insertDB(shop, res));        
    } else {
      await(setDB(shop, res));  
    }

    // Get app handle by GraphQL
    var api_res = await(callGraphql(ctx, shop, `{
      app {
        handle
      }
    }`));
    let redirect_url = `https://${shop}/admin/apps/${api_res.data.app.handle}`;

    let src_url = `https://${ctx.request.hostname}/tax.js`;

    // Get and delete the current my own JavaScript by REST API
    api_res = await(callRESTAPI(ctx, shop, 'script_tags', null, 'GET'));
    if (api_res.script_tags !== UNDEFINED) {
      //forEach doesn't support async and await!
      let size = api_res.script_tags.length;
      for (let i=0; i<size; i++) {
        if (api_res.script_tags[i].src == src_url) await(callRESTAPI(ctx, shop, `script_tags/${api_res.script_tags[i].id}`, null, 'DELETE'));
      }
    }
    //console.log(`${JSON.stringify(api_res)}`);

    // Insert my own JavaScript by REST API
    /*api_res = await(callRESTAPI(ctx, shop, 'script_tags', {
      "script_tag": {
        "event": "onload",
        "src": src_url
      }
    }));*/
    //console.log(`${JSON.stringify(api_res)}`);


    ctx.redirect(redirect_url);  

  } else {
    ctx.status = 500;
  }  
});

/* 
 * 
 * --- App proxy  ---
 * 
*/
router.get('/proxy',  async (ctx, next) => {
  console.log("---------- /proxy ------------");
  if (!checkAppProxySignature(ctx.request.query)) {
    ctx.status = 400;
    return;
  }

  let shop = ctx.request.query.shop;

  var res = {};

  var shop_data = await(getDB(shop)); 
  if (shop_data == null) {
    ctx.body = "No shop data";
  } else {
    var api_res = await(callRESTAPI(ctx, shop, 'countries', null, 'GET'));
    console.log(`${JSON.stringify(api_res)}`);

    res.tax = api_res.countries[0].tax;
    res.country = api_res.countries[0].code;
    res.locale = res.country === 'JP' ? 'ja-JP' : 'en-US';

    api_res = await(callGraphql(ctx, shop, `{
      shop {
        currencyCode
        currencyFormats {
          moneyWithCurrencyFormat
        }
        taxesIncluded
        products(first: 100) {
          edges {
            cursor
            node {
              id
              handle
              ... on Product {
                variants(first: 5) {
                  edges {
                    cursor
                    node {
                      ... on ProductVariant {
                        id
                        price
                        taxable
                      }
                    }
                  }
                }
              }
              
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }`));
    console.log(`${JSON.stringify(api_res)}`);

    res.currency = api_res.data.shop.currencyCode;
    res.tax_included = api_res.data.shop.taxesIncluded;

    let formatter = new Intl.NumberFormat(res.locale, {
      style: 'currency',
      currency: res.currency
    });

    res.products = [];
    if (res.tax_included == false) {
      let pSize = api_res.data.shop.products.edges.length;
      for (let i =0; i<pSize; i++) {
        let p = api_res.data.shop.products.edges[i];
        let d = {
          "handle": encodeURIComponent(p.node.handle),
          "variants": []
        };
        let vSize = p.node.variants.edges.length;
        for (let k =0; k<vSize; k++) {
          let v = p.node.variants.edges[k];
          if (v.node.taxable == true) {
            d.variants.push({
              "price": formatter.format(v.node.price)
            });
          }
        }
        res.products.push(d);
      }      
    }

  }
  ctx.body = res;
});


/* 
 * 
 * --- Webhook  ---
 * 
*/
router.post('/webhook', async (ctx, next) => {
  console.log("******** webhook ********");
  console.log(JSON.stringify(ctx.request.body));
  /* Check the signature */
  let valid = await(checkWebhookSignature(ctx, "mysecret"));
  if (!valid) {
    ctx.status = 200;
    return;
  }  
  let webhook_body = ctx.request.body;    
  ctx.status = 200;
});

/* --- Check if the given signature is correct or not --- */
const checkSignature = function(json) {
  let temp = JSON.parse(JSON.stringify(json));
  console.log(`checkSignature ${JSON.stringify(temp)}`);
  if (typeof temp.hmac === UNDEFINED) return false;
  let sig = temp.hmac;
  delete temp.hmac; 
  let msg = Object.entries(temp).sort().map(e => e.join('=')).join('&');
  //console.log(`checkSignature ${msg}`);
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(msg);
  let signarure =  hmac.digest('hex');
  //console.log(`checkSignature ${signarure}`);
  return signarure === sig ? true : false;
};

const checkAppProxySignature = function(json) {
  let temp = JSON.parse(JSON.stringify(json));
  console.log(`checkAppProxySignature ${JSON.stringify(temp)}`);
  if (typeof temp.signature === UNDEFINED) return false;
  let sig = temp.signature;
  delete temp.signature; 
  let msg = Object.entries(temp).sort().map(e => e.join('=')).join('');
  //console.log(`checkAppProxySignature ${msg}`);
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(msg);
  let signarure = hmac.digest('hex');
  //console.log(`checkAppProxySignature ${signarure}`);
  return signarure === sig ? true : false;
};

/* --- Check if the given signarure is corect or not for Webhook --- */
const checkWebhookSignature = function(ctx, secret) {
  return new Promise(function (resolve, reject) {
    console.log(`checkWebhookSignature Headers ${ctx.headers}`);
    let receivedSig = ctx.headers["x-shopify-hmac-sha256"];
    console.log(`checkWebhookSignature Given ${receivedSig}`);
    if (receivedSig == null) return resolve(false);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(ctx.request.rawBody, 'utf8').toString('utf8'));
    let signarure = hmac.digest('base64');
    console.log(`checkWebhookSignature Created: ${signarure}`);
    return resolve(receivedSig === signarure ? true : false);    
  });  
};

/* --- --- */
const callGraphql = function(ctx, shop, ql, query = true, token = null, path = GRAPHQL_PATH_ADMIN) {
  return new Promise(function (resolve, reject) {
    let api_req = {};
    // Set Gqphql string into query or mutation field of the JSON  as string
    if (query) {
      api_req.query = ql.replace(/\n/g, '');
    } else { // mutation
      api_req.mutation = ql.replace(/\n/g, '');
    } 
    var access_token = token;
    if (access_token == null) {
      getDB(shop).then(function(shop_data){
        if (shop_data == null) return resolve(null);
        access_token = shop_data.access_token;        
        accessEndpoint(ctx, `https://${shop}/${path}`, api_req, access_token).then(function(api_res){
          return resolve(api_res);
        }).catch(function(e){
          console.log(`callGraphql ${e}`);
          return reject(e);
        }); 
      }).catch(function(e){
        console.log(`callGraphql ${e}`);
        return reject(e);
      });     
    } else {
      accessEndpoint(ctx, `https://${shop}/${path}`, api_req, access_token).then(function(api_res){
        return resolve(api_res);
      }).catch(function(e){
        console.log(`callGraphql ${e}`);
        return reject(e);
      }); 
    }   
  });
};

/* --- --- */
const callRESTAPI = function(ctx, shop, sub_path, json, method = 'POST', token = null, path = RESTAPI_PATH_ADMIN) {
  return new Promise(function (resolve, reject) {
    var access_token = token;
    if (access_token == null) {
      getDB(shop).then(function(shop_data){
        if (shop_data == null) return resolve(null);
        access_token = shop_data.access_token;         
        accessEndpoint(ctx, `https://${shop}/${path}/${sub_path}.json`, json, access_token, CONTENT_TYPE_JSON, method).then(function(api_res){
          return resolve(api_res);
        }).catch(function(e){
          console.log(`callGraphql ${e}`);
          return reject(e);
        }); 
      }).catch(function(e){
        console.log(`callGraphql ${e}`);
        return reject(e);
      });     
    } else {
      accessEndpoint(ctx, `https://${shop}/${path}/${sub_path}.json`, json, access_token, CONTENT_TYPE_JSON, method).then(function(api_res){
        return resolve(api_res);
      }).catch(function(e){
        console.log(`callGraphql ${e}`);
        return reject(e);
      }); 
    }   
  });
};

/* ---  --- */
const accessEndpoint = function(ctx, endpoint, req, token = null, content_type = CONTENT_TYPE_JSON, method = 'POST') {
  console.log(`accessEndpoint　${endpoint} ${JSON.stringify(req)} ${token} ${content_type} ${method}`);
  return new Promise(function(resolve, reject) { 
    // Success callback
    var then_func = function(res){
      console.log(`accessEndpoint Success: ${res}`);
      return resolve(JSON.parse(res));
    };
    // Failure callback
    var catch_func = function(e){
      console.log(`accessEndpoint Error: ${e}`);
      return resolve(e);      
    };
    let headers = {};
    headers['Content-Type'] = content_type;
    if (token != null) {
      headers['X-Shopify-Access-Token'] = token;
    }
    if (method == 'GET') {
      ctx.get(endpoint, req, headers).then(then_func).catch(catch_func);
    } else if (method == 'PATCH') {
      ctx.patch(endpoint, req, headers).then(then_func).catch(catch_func);
    } else if (method == 'PUT') {
      ctx.put(endpoint, req, headers).then(then_func).catch(catch_func);
    } else if (method == 'DELETE') {
      ctx.delete(endpoint, req, headers).then(then_func).catch(catch_func);
    } else { // Default POST
      ctx.post(endpoint, req, headers).then(then_func).catch(catch_func);
    }    
  });
};    

/* ---  --- */
const insertDB = function(key, data) {
  return new Promise(function (resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    //console.log(`insertDB Connected: ${MONGO_URL}`);
    var dbo = db.db(MONGO_DB_NAME);    
    //console.log(`insertDB Used: ${MONGO_DB_NAME}`);
    console.log(`insertDB insertOne, _id:${key}`);
    dbo.collection(MONGO_COLLECTION).insertOne({"_id": key, "data": data}).then(function(res){
      db.close();
      return resolve(0);
    }).catch(function(e){
      console.log(`insertDB Error ${e}`);
    });
  }).catch(function(e){
    console.log(`insertDB Error ${e}`);
  });});
};

/* ---  --- */
const getDB = function(key) {
  return new Promise(function(resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    //console.log(`getDB Connected ${MONGO_URL}`);
    var dbo = db.db(MONGO_DB_NAME);    
    //console.log(`getDB Used ${MONGO_DB_NAME}`);
    console.log(`getDB findOne, _id:${key}`);
    dbo.collection(MONGO_COLLECTION).findOne({"_id": `${key}`}).then(function(res){
      db.close();
      if (res == null) return resolve(null);
      return resolve(res.data);
    }).catch(function(e){
      console.log(`getDB Error ${e}`);
    });
  }).catch(function(e){
    console.log(`getDB Error ${e}`);
  });});
};

/* ---  --- */
const setDB = function(key, data) {
  return new Promise(function(resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    //console.log(`setDB Connected ${MONGO_URL}`);
    var dbo = db.db(MONGO_DB_NAME);    
    //console.log(`setDB Used ${MONGO_DB_NAME}`);
    console.log(`setDB findOneAndUpdate, _id:${key}`);
    dbo.collection(MONGO_COLLECTION).findOneAndUpdate({"_id": `${key}`}, {$set: {"data": data}}, {new: true}).then(function(res){
      db.close();
      return resolve(res);
    }).catch(function(e){
      console.log(`setDB Error ${e}`);
    });
  }).catch(function(e){
    console.log(`setDB Error ${e}`);
  });});
};

/* ---  --- */
/*const searchDB = function(condition) {
  return new Promise(function(resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    //console.log(`searchDB Connected ${MONGO_URL}`);
    var dbo = db.db(MONGO_DB_NAME);    
    //console.log(`searchDB Used ${MONGO_DB_NAME}`);
    console.log(`searchDB find ${JSON.stringify(condition)}`);
    dbo.collection(MONGO_COLLECTION).find(condition).toArray().then(function(res){
      db.close();
      return resolve(res);
    }).catch(function(e){
      console.log(`searchDB Error ${e}`);
    });
  }).catch(function(e){
    console.log(`searchDB Error ${e}`);
  });});
};*/

app.use(router.routes());
app.use(router.allowedMethods());

if (!module.parent) app.listen(process.env.PORT || 3000);