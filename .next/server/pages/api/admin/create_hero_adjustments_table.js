"use strict";(()=>{var e={};e.id=2143,e.ids=[2143],e.modules={2418:e=>{e.exports=require("mysql2/promise")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,r){return r in t?t[r]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,r)):"function"==typeof t&&"default"===r?t:void 0}}})},3170:(e,t,r)=>{r.r(t),r.d(t,{config:()=>l,default:()=>u,routeModule:()=>c});var a={};r.r(a),r.d(a,{default:()=>d});var o=r(1802),n=r(7153),i=r(6249),s=r(1004);async function d(e,t){if("POST"!==e.method&&"GET"!==e.method)return t.setHeader("Allow","GET, POST"),t.status(405).json({error:"Method not allowed"});try{return await (0,s.I)(`
      CREATE TABLE IF NOT EXISTS hero_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hero_name VARCHAR(100) NOT NULL,
        adj_date DATE NULL,
        skill VARCHAR(100) NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_adj_hero_name (hero_name),
        INDEX idx_adj_date (adj_date),
        CONSTRAINT fk_adj_hero_name FOREIGN KEY (hero_name) REFERENCES heroes(hero_name)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `),t.status(200).json({ok:!0,message:"hero_adjustments table ensured"})}catch(e){return console.error("[create_hero_adjustments_table] error:",e),t.status(500).json({error:"Server error",details:e.message})}}let u=(0,i.l)(a,"default"),l=(0,i.l)(a,"config"),c=new o.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/admin/create_hero_adjustments_table",pathname:"/api/admin/create_hero_adjustments_table",bundlePath:"",filename:""},userland:a})},1004:(e,t,r)=>{let a;r.d(t,{I:()=>s,db:()=>i});var o=r(2418),n=r.n(o);async function i(){if(!a){let{DB_HOST:e="localhost",DB_NAME:t="",DB_USER:r="",DB_PASS:o="",DB_PORT:i="3306"}=process.env;try{a=n().createPool({host:e,port:Number(i),user:r,password:o,database:t,connectionLimit:10,charset:"utf8mb4_unicode_ci",acquireTimeout:6e4,timeout:6e4,enableKeepAlive:!0,keepAliveInitialDelay:0})}catch(e){throw console.error("Failed to create database pool:",e),Error("Database connection failed")}}return a}async function s(e,t=[]){try{let r=await i(),[a]=await r.execute(e,t);return a}catch(e){throw console.error("Database query failed:",e),e}}},7153:(e,t)=>{var r;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return r}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(r||(r={}))},1802:(e,t,r)=>{e.exports=r(145)}};var t=require("../../../webpack-api-runtime.js");t.C(e);var r=t(t.s=3170);module.exports=r})();