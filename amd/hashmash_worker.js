!function(){var t,n,e;!function(r){function i(t,n){return m.call(t,n)}function s(t,n){var e,r,i,s,o,u,a,l,c,f,h=n&&n.split("/"),p=v.map,d=p&&p["*"]||{};if(t&&"."===t.charAt(0))if(n){for(h=h.slice(0,h.length-1),t=h.concat(t.split("/")),l=0;l<t.length;l+=1)if(f=t[l],"."===f)t.splice(l,1),l-=1;else if(".."===f){if(1===l&&(".."===t[2]||".."===t[0]))break;l>0&&(t.splice(l-1,2),l-=2)}t=t.join("/")}else 0===t.indexOf("./")&&(t=t.substring(2));if((h||d)&&p){for(e=t.split("/"),l=e.length;l>0;l-=1){if(r=e.slice(0,l).join("/"),h)for(c=h.length;c>0;c-=1)if(i=p[h.slice(0,c).join("/")],i&&(i=i[r])){s=i,o=l;break}if(s)break;!u&&d&&d[r]&&(u=d[r],a=l)}!s&&u&&(s=u,o=a),s&&(e.splice(0,o,s),t=e.join("/"))}return t}function o(t,n){return function(){return p.apply(r,k.call(arguments,0).concat([t,n]))}}function u(t){return function(n){return s(n,t)}}function a(t){return function(n){_[t]=n}}function l(t){if(i(y,t)){var n=y[t];delete y[t],b[t]=!0,h.apply(r,n)}if(!i(_,t)&&!i(b,t))throw new Error("No "+t);return _[t]}function c(t){var n,e=t?t.indexOf("!"):-1;return e>-1&&(n=t.substring(0,e),t=t.substring(e+1,t.length)),[n,t]}function f(t){return function(){return v&&v.config&&v.config[t]||{}}}var h,p,d,g,_={},y={},v={},b={},m=Object.prototype.hasOwnProperty,k=[].slice;d=function(t,n){var e,r=c(t),i=r[0];return t=r[1],i&&(i=s(i,n),e=l(i)),i?t=e&&e.normalize?e.normalize(t,u(n)):s(t,n):(t=s(t,n),r=c(t),i=r[0],t=r[1],i&&(e=l(i))),{f:i?i+"!"+t:t,n:t,pr:i,p:e}},g={require:function(t){return o(t)},exports:function(t){var n=_[t];return"undefined"!=typeof n?n:_[t]={}},module:function(t){return{id:t,uri:"",exports:_[t],config:f(t)}}},h=function(t,n,e,s){var u,c,f,h,p,v,m=[];if(s=s||t,"function"==typeof e){for(n=!n.length&&e.length?["require","exports","module"]:n,p=0;p<n.length;p+=1)if(h=d(n[p],s),c=h.f,"require"===c)m[p]=g.require(t);else if("exports"===c)m[p]=g.exports(t),v=!0;else if("module"===c)u=m[p]=g.module(t);else if(i(_,c)||i(y,c)||i(b,c))m[p]=l(c);else{if(!h.p)throw new Error(t+" missing "+c);h.p.load(h.n,o(s,!0),a(c),{}),m[p]=_[c]}f=e.apply(_[t],m),t&&(u&&u.exports!==r&&u.exports!==_[t]?_[t]=u.exports:f===r&&v||(_[t]=f))}else t&&(_[t]=e)},t=n=p=function(t,n,e,i,s){return"string"==typeof t?g[t]?g[t](n):l(d(t,n).f):(t.splice||(v=t,n.splice?(t=n,n=e,e=null):t=r),n=n||function(){},"function"==typeof e&&(e=i,i=s),i?h(r,t,n,e):setTimeout(function(){h(r,t,n,e)},4),p)},p.config=function(t){return v=t,v.deps&&p(v.deps,v.callback),p},e=function(t,n,e){n.splice||(e=n,n=[]),i(_,t)||i(y,t)||(y[t]=[t,n,e])},e.amd={jQuery:!0}}(),e("almond",function(){}),/**
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
function(){}.call(this),e("amd/copyright",function(){}),function(){e("sha1",[],function(){var t,n,e,r,i,s,o;return t=function(t,n){return t<<n|t>>>32-n},r=function(t){var n,e,r,i;for(e="",n=i=7;i>=0;n=--i)r=15&t>>>4*n,e+=r.toString(16);return e},n=function(t,n,e,r){switch(t){case 0:return n&e^~n&r;case 1:return n^e^r;case 2:return n&e^n&r^e&r;case 3:return n^e^r}},s=function(e){var i,s,o,u,a,l,c,f,h,p,d,g,_,y,v,b,m,k,M,w,R,N,T,E,I,x,O,A,S;for(l=[1518500249,1859775393,2400959708,3395469782],e+=String.fromCharCode(128),M=e.length/4+2,f=Math.ceil(M/16),c=[],m=N=0,A=f-1;A>=0?A>=N:N>=A;m=A>=0?++N:--N)for(c[m]=[],k=T=0;15>=T;k=++T)c[m][k]=e.charCodeAt(64*m+4*k+0)<<24|e.charCodeAt(64*m+4*k+1)<<16|e.charCodeAt(64*m+4*k+2)<<8|e.charCodeAt(64*m+4*k+3)<<0;for(p=4294967296,c[f-1][14]=8*(e.length-1)/p,c[f-1][14]=Math.floor(c[f-1][14]),c[f-1][15]=4294967295&8*(e.length-1),i=1732584193,s=4023233417,o=2562383102,u=271733878,a=3285377520,d=[],m=E=0,S=f-1;S>=0?S>=E:E>=S;m=S>=0?++E:--E){for(R=I=0;15>=I;R=++I)d[R]=c[m][R];for(R=x=16;79>=x;R=++x)d[R]=t(d[R-3]^d[R-8]^d[R-14]^d[R-16],1);for(g=i,_=s,y=o,v=u,b=a,R=O=0;79>=O;R=++O)w=Math.floor(R/20),h=4294967295&t(g,5)+n(w,_,y,v)+b+l[w]+d[R],b=v,v=y,y=t(_,30),_=g,g=h;i=4294967295&i+g,s=4294967295&s+_,o=4294967295&o+y,u=4294967295&u+v,a=4294967295&a+b}return r(i)+r(s)+r(o)+r(u)+r(a)},i=function(t){var n,e,r,i,s;for(e=0,r=i=0,s=t.length-1;(s>=0?s>=i:i>=s)&&(n=parseInt(t[r],16),!isNaN(n));r=s>=0?++i:--i){switch(!1){case 0!==n:e+=4;break;case 1!==n:e+=3;break;case!(n>=2&&3>=n):e+=2;break;case!(n>=4&&7>=n):e+=1}if(0!==n)break}return e},o=function(t){var n,e;return n=""+t.challenge+":"+t.counter,e=s(n),i(e)>=t.bits?(t.result=n,!0):(t.counter+=1,!1)},e=function(t){return s(t)},e.leading0s=function(t){return i(t)},e.tryChallenge=function(t){return o(t)},e})}.call(this),function(){e("drone",["./sha1"],function(t){var n;return n=function(){function n(t){this.sendFn=t,this.sendFn({m:"ready"})}return n.MAX_RUNTIME=99,n.YIELD_TIME=1,n.prototype.gotMessage=function(t){if(null!=t.m)switch(t.m){case"data":return this._gotData(t.data);case"range":return this._gotRange(t.range)}},n.prototype._gotData=function(t){return null!=t?(this._data=t,this._requestRange()):void 0},n.prototype._gotRange=function(t){return null!=t?(this._range=t,this._data.counter=this._range.begin,this.start()):void 0},n.prototype._requestRange=function(){return this.sendFn({m:"request_range"})},n.prototype._sendResult=function(){return null!=this._data.result?this.sendFn({m:"result",result:this._data.result}):void 0},n.prototype.start=function(){if(null!=this._data&&null!=this._range){for(;null==this._data.result&&this._data.counter!==this._range.end;)t.tryChallenge(this._data);return null!=this._data.result?this._sendResult():this._requestRange()}},n}()})}.call(this),function(){e("amd/worker",["./copyright","../drone"],function(t,n){var e;return e=new n(function(t){return self.postMessage(t)}),self.onmessage=function(t){return e.gotMessage(t.data)}})}.call(this),n(["amd/worker"])}();
//@ sourceMappingURL=hashmash_worker.js.map