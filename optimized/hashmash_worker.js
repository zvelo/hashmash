!function(){var t,n,e;!function(r){function i(t,n){return b.call(t,n)}function o(t,n){var e,r,i,o,u,s,a,c,f,l,h=n&&n.split("/"),p=y.map,d=p&&p["*"]||{};if(t&&"."===t.charAt(0))if(n){for(h=h.slice(0,h.length-1),t=h.concat(t.split("/")),c=0;c<t.length;c+=1)if(l=t[c],"."===l)t.splice(c,1),c-=1;else if(".."===l){if(1===c&&(".."===t[2]||".."===t[0]))break;c>0&&(t.splice(c-1,2),c-=2)}t=t.join("/")}else 0===t.indexOf("./")&&(t=t.substring(2));if((h||d)&&p){for(e=t.split("/"),c=e.length;c>0;c-=1){if(r=e.slice(0,c).join("/"),h)for(f=h.length;f>0;f-=1)if(i=p[h.slice(0,f).join("/")],i&&(i=i[r])){o=i,u=c;break}if(o)break;!s&&d&&d[r]&&(s=d[r],a=c)}!o&&s&&(o=s,u=a),o&&(e.splice(0,u,o),t=e.join("/"))}return t}function u(t,n){return function(){return p.apply(r,w.call(arguments,0).concat([t,n]))}}function s(t){return function(n){return o(n,t)}}function a(t){return function(n){_[t]=n}}function c(t){if(i(v,t)){var n=v[t];delete v[t],m[t]=!0,h.apply(r,n)}if(!i(_,t)&&!i(m,t))throw new Error("No "+t);return _[t]}function f(t){var n,e=t?t.indexOf("!"):-1;return e>-1&&(n=t.substring(0,e),t=t.substring(e+1,t.length)),[n,t]}function l(t){return function(){return y&&y.config&&y.config[t]||{}}}var h,p,d,g,_={},v={},y={},m={},b=Object.prototype.hasOwnProperty,w=[].slice;d=function(t,n){var e,r=f(t),i=r[0];return t=r[1],i&&(i=o(i,n),e=c(i)),i?t=e&&e.normalize?e.normalize(t,s(n)):o(t,n):(t=o(t,n),r=f(t),i=r[0],t=r[1],i&&(e=c(i))),{f:i?i+"!"+t:t,n:t,pr:i,p:e}},g={require:function(t){return u(t)},exports:function(t){var n=_[t];return"undefined"!=typeof n?n:_[t]={}},module:function(t){return{id:t,uri:"",exports:_[t],config:l(t)}}},h=function(t,n,e,o){var s,f,l,h,p,y,b=[];if(o=o||t,"function"==typeof e){for(n=!n.length&&e.length?["require","exports","module"]:n,p=0;p<n.length;p+=1)if(h=d(n[p],o),f=h.f,"require"===f)b[p]=g.require(t);else if("exports"===f)b[p]=g.exports(t),y=!0;else if("module"===f)s=b[p]=g.module(t);else if(i(_,f)||i(v,f)||i(m,f))b[p]=c(f);else{if(!h.p)throw new Error(t+" missing "+f);h.p.load(h.n,u(o,!0),a(f),{}),b[p]=_[f]}l=e.apply(_[t],b),t&&(s&&s.exports!==r&&s.exports!==_[t]?_[t]=s.exports:l===r&&y||(_[t]=l))}else t&&(_[t]=e)},t=n=p=function(t,n,e,i,o){return"string"==typeof t?g[t]?g[t](n):c(d(t,n).f):(t.splice||(y=t,n.splice?(t=n,n=e,e=null):t=r),n=n||function(){},"function"==typeof e&&(e=i,i=o),i?h(r,t,n,e):setTimeout(function(){h(r,t,n,e)},4),p)},p.config=function(t){return y=t,y.deps&&p(y.deps,y.callback),p},e=function(t,n,e){n.splice||(e=n,n=[]),i(_,t)||i(v,t)||(v[t]=[t,n,e])},e.amd={jQuery:!0}}(),e("almond",function(){}),/**
 * @author Joshua Rubin <jrubin@zvelo.com>
 *
 * @license
 * zvelo HashMash Javascript Library
 *
 * Copyright (c) 2013, zvelo, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * * Neither the name of zvelo, Inc. nor the names of its contributors
 *   may be used to endorse or promote products derived from this software
 *   without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * ====
 *
 * SHA-1 implementation in JavaScript
 * (c) Chris Veness 2002-2010
 * www.movable-type.co.uk
 *  - http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html
 *  - http://csrc.nist.gov/groups/ST/toolkit/examples.html
 *
 * ====
 *
 * almond
 * (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 *
*/
function(){}.call(this),e("copyright",function(){}),function(){e("sha1",[],function(){var t,n,e,r,i,o,u;return t=function(t,n){return t<<n|t>>>32-n},r=function(t){var n,e,r,i;for(e="",n=i=7;i>=0;n=--i)r=15&t>>>4*n,e+=r.toString(16);return e},n=function(t,n,e,r){switch(t){case 0:return n&e^~n&r;case 1:return n^e^r;case 2:return n&e^n&r^e&r;case 3:return n^e^r}},o=function(e){var i,o,u,s,a,c,f,l,h,p,d,g,_,v,y,m,b,w,k,M,T,R,N,E,x,j,I,S,O;for(c=[1518500249,1859775393,2400959708,3395469782],e+=String.fromCharCode(128),k=e.length/4+2,l=Math.ceil(k/16),f=[],b=R=0,S=l-1;S>=0?S>=R:R>=S;b=S>=0?++R:--R)for(f[b]=[],w=N=0;15>=N;w=++N)f[b][w]=e.charCodeAt(64*b+4*w+0)<<24|e.charCodeAt(64*b+4*w+1)<<16|e.charCodeAt(64*b+4*w+2)<<8|e.charCodeAt(64*b+4*w+3)<<0;for(p=4294967296,f[l-1][14]=8*(e.length-1)/p,f[l-1][14]=Math.floor(f[l-1][14]),f[l-1][15]=4294967295&8*(e.length-1),i=1732584193,o=4023233417,u=2562383102,s=271733878,a=3285377520,d=[],b=E=0,O=l-1;O>=0?O>=E:E>=O;b=O>=0?++E:--E){for(T=x=0;15>=x;T=++x)d[T]=f[b][T];for(T=j=16;79>=j;T=++j)d[T]=t(d[T-3]^d[T-8]^d[T-14]^d[T-16],1);for(g=i,_=o,v=u,y=s,m=a,T=I=0;79>=I;T=++I)M=Math.floor(T/20),h=4294967295&t(g,5)+n(M,_,v,y)+m+c[M]+d[T],m=y,y=v,v=t(_,30),_=g,g=h;i=4294967295&i+g,o=4294967295&o+_,u=4294967295&u+v,s=4294967295&s+y,a=4294967295&a+m}return r(i)+r(o)+r(u)+r(s)+r(a)},i=function(t){var n,e,r,i,o;for(e=0,r=i=0,o=t.length-1;(o>=0?o>=i:i>=o)&&(n=parseInt(t[r],16),!isNaN(n));r=o>=0?++i:--i){switch(!1){case 0!==n:e+=4;break;case 1!==n:e+=3;break;case!(n>=2&&3>=n):e+=2;break;case!(n>=4&&7>=n):e+=1}if(0!==n)break}return e},u=function(t){var n,e;return n=""+t.challenge+":"+t.counter,e=o(n),i(e)>=t.bits?(t.result=n,!0):(t.counter+=1,!1)},e=function(t){return o(t)},e.leading0s=function(t){return i(t)},e.tryChallenge=function(t){return u(t)},e})}.call(this),function(){e("drone",["./sha1"],function(t){var n;return n=function(){function n(t){this.sendFn=t,this.sendFn({m:"ready"})}return n.MAX_RUNTIME=99,n.YIELD_TIME=1,n.prototype.gotMessage=function(t){if(null!=t.m)switch(t.m){case"data":return this._gotData(t.data);case"range":return this._gotRange(t.range)}},n.prototype._gotData=function(t){return null!=t?(this._data=t,this._requestRange()):void 0},n.prototype._gotRange=function(t){return null!=t?(this._range=t,this._data.counter=this._range.begin,this.start()):void 0},n.prototype._requestRange=function(){return this.sendFn({m:"request_range"})},n.prototype._sendResult=function(){return null!=this._data.result?this.sendFn({m:"result",result:this._data.result}):void 0},n.prototype.start=function(){if(null!=this._data&&null!=this._range){for(;null==this._data.result&&this._data.counter!==this._range.end;)t.tryChallenge(this._data);return null!=this._data.result?this._sendResult():this._requestRange()}},n}()})}.call(this),function(){e("worker",["./drone"],function(t){var n;return n=new t(function(t){return self.postMessage(t)}),self.onmessage=function(t){return n.gotMessage(t.data)}})}.call(this),n(["worker"])}();
//@ sourceMappingURL=hashmash_worker.js.map