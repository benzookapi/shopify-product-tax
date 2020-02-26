'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaRequest = require('koa-http-request');

const crypto = require('crypto');

const fs = require('fs');

const mongo = require('mongodb');

const router = new Router();
const app = module.exports = new Koa();

app.use(bodyParser());

app.use(koaRequest({
  
}));

const API_KEY = `${process.env.SHOPIFY_API_KEY}`;
const API_SECRET = `${process.env.SHOPIFY_API_SECRET}`;

const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';

const GRAPHQL_PATH_ADMIN = 'admin/api/2020-01/graphql.json';

const UNDEFINED = 'undefined';

const HMAC_SECRET = API_SECRET;

// Mongo URL and DB name for date store
const MONGO_URL = `${process.env.SHOPIFY_MONGO_URL}`;
const MONGO_DB_NAME = `${process.env.SHOPIFY_MONGO_DB_NAME}`;
const MONGO_COLLECTION = 'shops';

// Set Timezone Japan
process.env.TZ = 'Asia/Tokyo'; 

/* 
 *
 * --- Callback endpoint during the installation ---
 * 
*/
router.get('/callback',  async (ctx, next) => {
  console.log("+++++++++ / ++++++++++");
  if (!verifyCode(ctx.request.query)) {
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
    shop_data = await(getDB(shop)); 
    console.log(`${JSON.stringify(shop_data)}`);
    var api_req = {};
    api_req.query = `{
      shop {
        products(first: 5) {
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
    }`.replace(/\n/g, '');
    var api_res = await(accessEndpoint(ctx, `https://${shop}/${GRAPHQL_PATH_ADMIN}`, api_req, shop_data.data.access_token)); 
    console.log(`${api_res}`);
  }

  ctx.status = 200;
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

/* --- Check if the given code is correct or not --- */
const verifyCode = function(json) {
  let temp = JSON.parse(JSON.stringify(json));
  console.log(`verifyCode ${JSON.stringify(temp)}`);
  if (typeof temp.hmac === UNDEFINED) return false;
  let sig = temp.hmac;
  delete temp.hmac; 
  let msg = Object.entries(temp).sort().map(e => e.join('=')).join('&');
  //console.log(`verifyCode ${msg}`);
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(msg);
  let signarure = hmac.digest('hex');
  //console.log(`verifyCode ${signarure}`);
  return signarure === sig ? true : false;
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
    if (method == "GET") {
      ctx.get(endpoint, req, headers).then(then_func).catch(catch_func);
    } else if (method == "PATCH") {
      ctx.patch(endpoint, req, headers).then(then_func).catch(catch_func);
    } else { // Default POST
      ctx.post(endpoint, req, headers).then(then_func).catch(catch_func);
    }    
  });
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
      return resolve(res);
    }).catch(function(e){
      console.log(`getDB Error ${e}`);
    });
  }).catch(function(e){
    console.log(`getDB Error ${e}`);
  });});
};

/* ---  --- */
const setDB = function(key, update_data) {
  return new Promise(function(resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    //console.log(`setDB Connected ${MONGO_URL}`);
    var dbo = db.db(MONGO_DB_NAME);    
    //console.log(`setDB Used ${MONGO_DB_NAME}`);
    console.log(`setDB findOneAndUpdate, _id:${key}`);
    dbo.collection(MONGO_COLLECTION).findOneAndUpdate({"_id": `${key}`}, {$set: update_data}, {new: true}).then(function(res){
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
const searchDB = function(condition) {
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
};

app.use(router.routes());
app.use(router.allowedMethods());

if (!module.parent) app.listen(process.env.PORT || 3000);