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

const CONTENT_TYPE = 'application/json';
const HMAC_SECRET = 'hush';

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
    ctx.status = 404;
    return;
  }
  let req = {};
  req.client_id = API_KEY;
  req.client_secret = API_SECRET;
  req.code = ctx.request.query.code;

  let res = await(accessEndpoint(`POST https://${ctx.request.query.shop}.myshopify.com/admin/oauth/access_token`, req)); 

  logJson(res);

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

/* --- --- */
const logJson = function(d, header = "") {
    console.log(`${header} ${JSON.stringify(d)}`);
}

/* --- Check if the given code is correct or not --- */
const verifyCode = function(json) {
  let temp = JSON.parse(JSON.stringify(json));
  logJson(temp, "verifyCode");
  if (typeof temp.hmac === 'undefined') return false;
  let sig = temp.hmac;
  delete temp.hmac; 
  let msg = Object.entries(temp).sort().map(e => e.join('=')).join('&');
  console.log(msg, "verifyCode");
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(msg);
  let signarure = hmac.digest('hex');
  console.log(signarure, "verifyCode");
  return signarure === sig ? true : false;
};

/* ---  --- */
const accessEndpoint = function(endpoint, req, method = "POST") {   
    return new Promise(function(resolve, reject) { 
      // Success callback
      var then_func = function(res){
        return resolve(res);
      };
      // Failure callback
      var catch_func = function(e){
        console.log(`ERROR: ${e}`);
        return resolve(e);      
      };
      if (method == "GET") {
        ctx.get(endpoint, req, {
          'Content-Type': CONTENT_TYPE
        }).then(then_func).catch(catch_func);
      } else if (method == "PATCH") {
        ctx.patch(endpoint, req, {
          'Content-Type': CONTENT_TYPE,
        }).then(then_func).catch(catch_func);
      } else { // Default POST
        ctx.post(endpoint, req, {
          'Content-Type': CONTENT_TYPE,
        }).then(then_func).catch(catch_func);
      }    
    });
  };    

/* --- Check if the given signarure is corect or not for Webhook --- */
const checkWebhookSignature = function(ctx, secret) {
  return new Promise(function (resolve, reject) {
    console.log("[Shopify checkWebhookSignature] Headers: " + JSON.stringify(ctx.headers));
    let receivedSig = ctx.headers["x-shopify-hmac-sha256"];
    console.log("[Shopify checkWebhookSignature] Given: " + receivedSig);
    if (receivedSig == null) return resolve(false);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(ctx.request.rawBody, 'utf8').toString('utf8'));
    let signarure = hmac.digest('base64');
    console.log("[Shopify checkWebhookSignature] Created: " + signarure);
    return resolve(receivedSig === signarure ? true : false);    
  });  
};

/* ---  --- */
const insertDB = function(key, data) {
  return new Promise(function (resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    console.log("[MONGO DB] Connected: " + MONGO_URL);
    var dbo = db.db(MONGO_DB_NAME);    
    console.log("[MONGO DB] Used: " + MONGO_DB_NAME);
    console.log("[MONGO DB] insertOne, _id:"  + key);
    dbo.collection(MONGO_COLLECTION).insertOne({"_id": key, "data": data}).then(function(res){
      db.close();
      return resolve(0);
    }).catch(function(e){
      console.log("[MONGO DB] Error:" + e);
    });
  }).catch(function(e){
    console.log("[MONGO DB] Error:" + e);
  });});
};

/* ---  --- */
const getDB = function(key) {
  return new Promise(function(resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    console.log("[MONGO DB] Connected: " + MONGO_URL);
    var dbo = db.db(MONGO_DB_NAME);    
    console.log("[MONGO DB] Used: " + MONGO_DB_NAME);
    console.log("[MONGO DB] findOne, _id:"  + key);
    dbo.collection(MONGO_COLLECTION).findOne({"_id": `${key}`}).then(function(res){
      db.close();
      return resolve(res);
    }).catch(function(e){
      console.log("[MONGO DB] Error: " + e);
    });
  }).catch(function(e){
    console.log("[MONGO DB] Error: " + e);
  });});
};

/* ---  --- */
const setDB = function(key, update_data) {
  return new Promise(function(resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    console.log("[MONGO DB] Connected: " + MONGO_URL);
    var dbo = db.db(MONGO_DB_NAME);    
    console.log("[MONGO DB] Used: " + MONGO_DB_NAME);
    console.log("[MONGO DB] findOneAndUpdate, _id:"  + key);
    dbo.collection(MONGO_COLLECTION).findOneAndUpdate({"_id": `${key}`}, {$set: update_data}, {new: true}).then(function(res){
      db.close();
      return resolve(res);
    }).catch(function(e){
      console.log("[MONGO DB] Error: " + e);
    });
  }).catch(function(e){
    console.log("[MONGO DB] Error: " + e);
  });});
};

/* ---  --- */
const searchDB = function(condition) {
  return new Promise(function(resolve, reject) { mongo.MongoClient.connect(MONGO_URL).then(function(db){
    console.log("[MONGO DB] Connected: " + MONGO_URL);
    var dbo = db.db(MONGO_DB_NAME);    
    console.log("[MONGO DB] Used: " + MONGO_DB_NAME);
    console.log("[MONGO DB] find:"  + JSON.stringify(condition));
    dbo.collection(MONGO_COLLECTION).find(condition).toArray().then(function(res){
      db.close();
      return resolve(res);
    }).catch(function(e){
      console.log("[MONGO DB] Error: " + e);
    });
  }).catch(function(e){
    console.log("[MONGO DB] Error: " + e);
  });});
};

app.use(router.routes());
app.use(router.allowedMethods());

if (!module.parent) app.listen(process.env.PORT || 3000);