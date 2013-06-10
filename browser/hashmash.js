!function(t,n){"function"==typeof define&&define.amd?define(n):t.HashMash=n()}(this,function(){var t,n,e;return function(r){function s(t,n){return k.call(t,n)}function i(t,n){var e,r,s,i,o,u,a,l,c,h,f=n&&n.split("/"),p=y.map,d=p&&p["*"]||{};if(t&&"."===t.charAt(0))if(n){for(f=f.slice(0,f.length-1),t=f.concat(t.split("/")),l=0;l<t.length;l+=1)if(h=t[l],"."===h)t.splice(l,1),l-=1;else if(".."===h){if(1===l&&(".."===t[2]||".."===t[0]))break;l>0&&(t.splice(l-1,2),l-=2)}t=t.join("/")}else 0===t.indexOf("./")&&(t=t.substring(2));if((f||d)&&p){for(e=t.split("/"),l=e.length;l>0;l-=1){if(r=e.slice(0,l).join("/"),f)for(c=f.length;c>0;c-=1)if(s=p[f.slice(0,c).join("/")],s&&(s=s[r])){i=s,o=l;break}if(i)break;!u&&d&&d[r]&&(u=d[r],a=l)}!i&&u&&(i=u,o=a),i&&(e.splice(0,o,i),t=e.join("/"))}return t}function o(t,n){return function(){return p.apply(r,M.call(arguments,0).concat([t,n]))}}function u(t){return function(n){return i(n,t)}}function a(t){return function(n){g[t]=n}}function l(t){if(s(b,t)){var n=b[t];delete b[t],v[t]=!0,f.apply(r,n)}if(!s(g,t)&&!s(v,t))throw new Error("No "+t);return g[t]}function c(t){var n,e=t?t.indexOf("!"):-1;return e>-1&&(n=t.substring(0,e),t=t.substring(e+1,t.length)),[n,t]}function h(t){return function(){return y&&y.config&&y.config[t]||{}}}var f,p,d,_,g={},b={},y={},v={},k=Object.prototype.hasOwnProperty,M=[].slice;d=function(t,n){var e,r=c(t),s=r[0];return t=r[1],s&&(s=i(s,n),e=l(s)),s?t=e&&e.normalize?e.normalize(t,u(n)):i(t,n):(t=i(t,n),r=c(t),s=r[0],t=r[1],s&&(e=l(s))),{f:s?s+"!"+t:t,n:t,pr:s,p:e}},_={require:function(t){return o(t)},exports:function(t){var n=g[t];return"undefined"!=typeof n?n:g[t]={}},module:function(t){return{id:t,uri:"",exports:g[t],config:h(t)}}},f=function(t,n,e,i){var u,c,h,f,p,y,k=[];if(i=i||t,"function"==typeof e){for(n=!n.length&&e.length?["require","exports","module"]:n,p=0;p<n.length;p+=1)if(f=d(n[p],i),c=f.f,"require"===c)k[p]=_.require(t);else if("exports"===c)k[p]=_.exports(t),y=!0;else if("module"===c)u=k[p]=_.module(t);else if(s(g,c)||s(b,c)||s(v,c))k[p]=l(c);else{if(!f.p)throw new Error(t+" missing "+c);f.p.load(f.n,o(i,!0),a(c),{}),k[p]=g[c]}h=e.apply(g[t],k),t&&(u&&u.exports!==r&&u.exports!==g[t]?g[t]=u.exports:h===r&&y||(g[t]=h))}else t&&(g[t]=e)},t=n=p=function(t,n,e,s,i){return"string"==typeof t?_[t]?_[t](n):l(d(t,n).f):(t.splice||(y=t,n.splice?(t=n,n=e,e=null):t=r),n=n||function(){},"function"==typeof e&&(e=s,s=i),s?f(r,t,n,e):setTimeout(function(){f(r,t,n,e)},4),p)},p.config=function(t){return y=t,y.deps&&p(y.deps,y.callback),p},e=function(t,n,e){n.splice||(e=n,n=[]),s(g,t)||s(b,t)||(b[t]=[t,n,e])},e.amd={jQuery:!0}}(),e("almond",function(){}),/**
 * @license
 * zvelo HashMash Javascript Library
 *
 * Copyright 2013 zvelo, Inc. All Rights Reserved
 *
 * SHA-1 implementation in JavaScript
 * (c) Chris Veness 2002-2010
 * www.movable-type.co.uk
 *  - http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html
 *  - http://csrc.nist.gov/groups/ST/toolkit/examples.html
 *
 * almond
 * (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
*/
function(){}.call(this),e("browser/copyright",function(){}),function(){e("sha1",[],function(){var t,n,e,r,s,i,o;return t=function(t,n){return t<<n|t>>>32-n},r=function(t){var n,e,r,s;for(e="",n=s=7;s>=0;n=--s)r=15&t>>>4*n,e+=r.toString(16);return e},n=function(t,n,e,r){switch(t){case 0:return n&e^~n&r;case 1:return n^e^r;case 2:return n&e^n&r^e&r;case 3:return n^e^r}},i=function(e){var s,i,o,u,a,l,c,h,f,p,d,_,g,b,y,v,k,M,w,m,N,R,T,E,I,S,O,A,D;for(l=[1518500249,1859775393,2400959708,3395469782],e+=String.fromCharCode(128),w=e.length/4+2,h=Math.ceil(w/16),c=[],k=R=0,A=h-1;A>=0?A>=R:R>=A;k=A>=0?++R:--R)for(c[k]=[],M=T=0;15>=T;M=++T)c[k][M]=e.charCodeAt(64*k+4*M+0)<<24|e.charCodeAt(64*k+4*M+1)<<16|e.charCodeAt(64*k+4*M+2)<<8|e.charCodeAt(64*k+4*M+3)<<0;for(p=4294967296,c[h-1][14]=8*(e.length-1)/p,c[h-1][14]=Math.floor(c[h-1][14]),c[h-1][15]=4294967295&8*(e.length-1),s=1732584193,i=4023233417,o=2562383102,u=271733878,a=3285377520,d=[],k=E=0,D=h-1;D>=0?D>=E:E>=D;k=D>=0?++E:--E){for(N=I=0;15>=I;N=++I)d[N]=c[k][N];for(N=S=16;79>=S;N=++S)d[N]=t(d[N-3]^d[N-8]^d[N-14]^d[N-16],1);for(_=s,g=i,b=o,y=u,v=a,N=O=0;79>=O;N=++O)m=Math.floor(N/20),f=4294967295&t(_,5)+n(m,g,b,y)+v+l[m]+d[N],v=y,y=b,b=t(g,30),g=_,_=f;s=4294967295&s+_,i=4294967295&i+g,o=4294967295&o+b,u=4294967295&u+y,a=4294967295&a+v}return r(s)+r(i)+r(o)+r(u)+r(a)},s=function(t){var n,e,r,s,i;for(e=0,r=s=0,i=t.length-1;(i>=0?i>=s:s>=i)&&(n=parseInt(t[r],16),!isNaN(n));r=i>=0?++s:--s){switch(!1){case 0!==n:e+=4;break;case 1!==n:e+=3;break;case!(n>=2&&3>=n):e+=2;break;case!(n>=4&&7>=n):e+=1}if(0!==n)break}return e},o=function(t){var n,e;return n=""+t.challenge+":"+t.counter,e=i(n),s(e)>=t.bits?(t.result=n,!0):(t.counter+=1,!1)},e=function(t){return i(t)},e.leading0s=function(t){return s(t)},e.tryChallenge=function(t){return o(t)},e})}.call(this),function(){e("hashmash",["./sha1"],function(t){var n,e,r;return e=function(t){return"string"==typeof t?6!==t.length?null:t:"number"!=typeof t?null:e(""+t)},r=function(t,n){return n.start=n.end+1,n.start===t.length?!1:(n.end=t.indexOf(":",n.start),-1===n.end?!1:n.end===n.start?!1:!0)},n=function(){function n(t,e,r,s,i){var o,u,a;this._bits=t,this._bits<n.MIN_BITS&&(this._bits=n.MIN_BITS),this._workers=[],this._range={},this._resetRange(),o=n.TaskMaster,null==s&&null!=n.BackupTaskMaster&&(o=n.BackupTaskMaster),i=null!=i?Math.min(i,o.MAX_NUM_WORKERS):o.DEFAULT_NUM_WORKERS,i&&(console.log("using "+i+" workers"),a=function(t){return this.stop(),null!=r?e.call(r,t):e(t)},this._workers=function(){var t,n;for(n=[],u=t=1;i>=1?i>=t:t>=i;u=i>=1?++t:--t)n.push(new o(this,a,this._range,s));return n}.call(this))}return n.VERSION=1,n.MIN_BITS=16,n.hash=t,n.date=function(){var t,n,e,r;return e=new Date,r=("0"+(e.getYear()-100)).slice(-2),n=("0"+(e.getMonth()+1)).slice(-2),t=("0"+e.getDate()).slice(-2),""+r+n+t},n.parse=function(t){var n,e,s;return null==t?null:(e={},s={start:0,end:-1,length:function(){return this.end-this.start}},r(t,s)?(e.version=parseInt(t.substr(s.start,s.length()),10),isNaN(e.version)?null:r(t,s)?(e.bits=parseInt(t.substr(s.start,s.length()),10),isNaN(e.bits)?null:r(t,s)?(e.date=parseInt(t.substr(s.start,s.length()),10),isNaN(e.date)?null:r(t,s)?(e.resource=t.substr(s.start,s.length()),e.resource.length?r(t,s)?(e.rand=t.substr(s.start,s.length()),e.rand.length?(r(t,s),n=(-1===s.end?t.length:s.end)-s.start,e.counter=parseInt(t.substr(s.start,n),10),isNaN(e.counter)?null:e):null):null:null):null):null):null):null)},n.unparse=function(t){var n,r;return r="",null==t.version?r:(r+=""+t.version+":",null==t.bits?r:(r+=""+t.bits+":",null==t.date?r:(n=e(t.date),null==n?r:(r+=""+n+":",null==t.resource?r:(r+=""+t.resource+":",null==t.rand?r:(r+=t.rand,null==t.counter?r:r+=":"+t.counter))))))},n.prototype._resetRange=function(){return this._range={begin:0,end:-1}},n.prototype._sendData=function(t){var n,e,r,s,i;for(s=this._workers,i=[],e=0,r=s.length;r>e;e++)n=s[e],i.push(n.sendData(t));return i},n.prototype.stop=function(){var t,n,e,r,s;for(r=this._workers,s=[],n=0,e=r.length;e>n;n++)t=r[n],s.push(t.stop());return s},n.prototype.generate=function(t){var e,r;return this._resetRange(),r={version:n.VERSION,bits:this._bits,date:n.date(),resource:t,rand:Math.random().toString(36).substr(2)},e={challenge:n.unparse(r),counter:0,bits:r.bits},this._sendData(e)},n.prototype.validate=function(e){var r,s;return null==e?!1:null==this._bits?!1:(r=n.parse(e),null==r?!1:r.bits<this._bits?!1:r.bits<n.MIN_BITS?!1:r.version!==n.VERSION?!1:(s=n.date(),r.date<s-1||r.date>s+1?!1:t.leading0s(n.hash(e))>=r.bits))},n}()})}.call(this),function(){var t={}.hasOwnProperty,n=function(n,e){function r(){this.constructor=n}for(var s in e)t.call(e,s)&&(n[s]=e[s]);return r.prototype=e.prototype,n.prototype=new r,n.__super__=e.prototype,n};e("taskmaster",["./sha1"],function(t){var e,r,s,i,o,u;return e=99,r=1,u={},s=function(){function t(t,n,e){this._caller=t,this._cb=n,this._range=e,this._sendQueue=[],this._ready=!1}return t.RANGE_INCREMENT=Math.pow(2,15),t.prototype._send=function(t){return this._spawn(),null!=this.sendFn?this._ready?this.sendFn(t):this._sendQueue.push(t):void 0},t.prototype._setGo=function(){var t;for(this._ready=!0,t=[];this._sendQueue.length;)t.push(this._send(this._sendQueue.shift()));return t},t.prototype._spawn=function(){return null==this.worker?this.connect():void 0},t.prototype._incRange=function(){return this._range.begin=this._range.end+1,this._range.end=this._range.begin+t.RANGE_INCREMENT-1},t.prototype._sendRange=function(){return this._incRange(),this._send({m:"range",range:this._range})},t.prototype._gotResult=function(t){return null!=t?this._cb.call(this._caller,t):void 0},t.prototype._gotMessage=function(t){if(null!=(null!=t?t.m:void 0))switch(t.m){case"ready":return this._setGo();case"request_range":return this._sendRange();case"result":return this._gotResult(t.result);case"console_log":return console.log("worker",t.data)}},t.prototype.sendData=function(t){return this._send({m:"data",data:t})},t.prototype.stop=function(){return this._ready=!1,this._sendQueue.length=0,null!=this.worker?(this.disconnect(),delete this.worker,delete this.sendFn):void 0},t}(),u.TaskMaster=s,o=function(t){function e(t,n,r,s){this.file=s,e.__super__.constructor.call(this,t,n,r)}return n(e,t),e.MAX_NUM_WORKERS=8,e.DEFAULT_NUM_WORKERS=4,e.prototype.connect=function(){var t;return this.worker=new Worker(this.file),t=this,this.worker.onmessage=function(n){return t._gotMessage(n.data)},this.worker.onerror=function(t){throw t.data},this.sendFn=function(t){return this.worker.postMessage(t)}},e.prototype.disconnect=function(){return this.worker.terminate()},e}(s),u.WebTaskMaster=o,i=function(){function n(t,n){this._caller=t,this._cb=n}return n.MAX_NUM_WORKERS=1,n.DEFAULT_NUM_WORKERS=1,n.prototype.sendData=function(t){return this._data=t,delete this._stopFlag,this.start()},n.prototype.start=function(){var n,s;for(s=new Date;!(null!=this._stopFlag||null!=this._data.result||new Date-s>=e);)t.tryChallenge(this._data);return null==this._stopFlag?null!=this._data.result?this._cb.call(this._caller,this._data.result):(n=this,setTimeout(function(){return n.start()},r)):void 0},n.prototype.stop=function(){return this._stopFlag=!0},n}(),u.TimeoutTaskMaster=i,u})}.call(this),function(){e("browser/main",["./copyright","../hashmash","../taskmaster"],function(t,n,e){var r,s;return s=e.WebTaskMaster,r=e.TimeoutTaskMaster,"undefined"!=typeof Worker&&null!==Worker?(n.TaskMaster=s,n.BackupTaskMaster=r):n.TaskMaster=r,n})}.call(this),n("browser/main")});
//@ sourceMappingURL=hashmash.js.map