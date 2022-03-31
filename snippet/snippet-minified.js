"use strict";function t(t,n){
/*
   * Returns true or false based on whether doNotTack is enabled. It also takes into account the
   * anomalies, such as !bugzilla 887703, which effect versions of Fx 31 and lower. It also handles
   * IE versions on Windows 7, 8 and 8.1, where the DNT implementation does not honor the spec.
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1217896 for more details
   */
let o=t||navigator.doNotTrack||window.doNotTrack||navigator.msDoNotTrack;const e=n||navigator.userAgent;const i=["Windows NT 6.1","Windows NT 6.2","Windows NT 6.3"];const r=e.match(/Firefox\/(\d+)/);const s=/MSIE|Trident/i;const c=s.test(e);const a=e.match(/Windows.+?(?=;)/g);if(c&&typeof Array.prototype.indexOf!=="function"){return false}else if(r&&parseInt(r[1],10)<32){o="Unspecified"}else if(c&&a&&i.indexOf(a.toString())!==-1){o="Unspecified"}else{o={0:"Disabled",1:"Enabled"}[o]||"Unspecified"}return o==="Enabled"?true:false}
// This function consolidates parameters
// for the initial ping to FxA metrics endpoint
// we want to send UTMs, entrypoint and formType
// UTMs are added as default values if they don't
// exist on the window
// see https://mozilla.github.io/ecosystem-platform/docs/relying-parties/metrics-for-relying-parties
function f(){const t=["source","campaign","content","term","medium"];const n=new URLSearchParams(window.location.search);
// fxa will keep the most recent set of params until they are replaced
// by flushing them here
t.forEach(t=>{if(!n.has(`utm_${t}`)){n.append(`utm_${t}`,"fpn-default")}});n.set("entrypoint","fpn-site-visit");n.set("form_type","button");return n}
/* This adds flow information to the window. The click handler of the fxa
   subscription links will pick them up and add them to the query paramenters.
   This gives funnel from the landing page to through the fxa lifecycle.
*/
function p(t){window.t=t}
/*This sets up the FxA funnel for both the proxy and the VPN
 first we check storage to see if we've collected flow data
 in the last 31 days...If so, we pull it out of storate and
 and append params to fxa links for the vpn
 If we don't have these params, we go fetch them,
then set them in storage and appen them to fxa links (if any) 
Using localstorage with a 31 day window lets the VPN fetch and use
the fxa flow params using a content script,here: https://github.com/mozilla/secure-proxy/blob/master/src/content/fetch-fxa-flow-params.js
*/
async function n(){let t;const n=window.localStorage;const o=n.getItem("flowInfo")||null;
// check if we have stored flow info in the last 31 days
// and just return if we have
if(o!==null&&o!=="err"){t=JSON.parse(o);const i=new Date;const r=i.getTime()-t.o;if(r<31*24*60*60*1e3){p(t);return}}try{const s=document.querySelector("meta[name='fxa']");const c=s&&s.content;if(!c){return}const a=f();const u=await fetch(`${c}metrics-flow/?${a.toString()}`,{mode:"cors"});t=await u.json();p(t);n.setItem("flowInfo",JSON.stringify(t))}catch(e){
// eslint-disable-next-line no-console
console.log(e);n.setItem("flowInfo","err")}}function o(){if(t()){return}!function(r,s){var c,a,u,f;s.i||(window.u=s,s.p=[],s.init=function(t,n,o){function e(t,n){var o=n.split(".");2==o.length&&(t=t[o[0]],n=o[1]),t[n]=function(){t.push([n].concat(Array.prototype.slice.call(arguments,0)))}}(u=r.createElement("script")).type="text/javascript",u["async"]=!0,u.src=n.l+"/static/array.js",(f=r.getElementsByTagName("script")[0]).parentNode.insertBefore(u,f);var i=s;for(void 0!==o?i=s[o]=[]:o="posthog",i.m=i.m||[],i.toString=function(t){var n="posthog";return"posthog"!==o&&(n+="."+o),t||(n+=" (stub)"),n},i.m.toString=function(){return i.toString(1)+".people (stub)"},c="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags".split(" "),a=0;a<c.length;a++)e(i,c[a]);s.p.push([t,n,o])},s.i=1)}(document,window.u||[]);window.u.init("phc_XQlc4j5RDhOh3WcsllRKJO8FGluXNQOrCYWLmBmH290",{l:"https://app.posthog.com"})}(function(){document.addEventListener("DOMContentLoaded",()=>{o()})})();
