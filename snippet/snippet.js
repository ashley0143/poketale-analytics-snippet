
function _dntEnabled(dnt, userAgent) {
   /*
   * Returns true or false based on whether doNotTack is enabled. It also takes into account the
   * anomalies, such as !bugzilla 887703, which effect versions of Fx 31 and lower. It also handles
   * IE versions on Windows 7, 8 and 8.1, where the DNT implementation does not honor the spec.
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1217896 for more details
   */
  let dntStatus = dnt || navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  const ua = userAgent || navigator.userAgent;
  const anomalousWinVersions = ["Windows NT 6.1", "Windows NT 6.2", "Windows NT 6.3"];

  const fxMatch = ua.match(/Firefox\/(\d+)/);
  const ieRegEx = /MSIE|Trident/i;
  const isIE = ieRegEx.test(ua);
  const platform = ua.match(/Windows.+?(?=;)/g);

  if (isIE && typeof Array.prototype.indexOf !== "function") {
    return false;
  } else if (fxMatch && parseInt(fxMatch[1], 10) < 32) {
    dntStatus = "Unspecified";
  } else if (isIE && platform && anomalousWinVersions.indexOf(platform.toString()) !== -1) {
    dntStatus = "Unspecified";
  } else {
    dntStatus = { 0: "Disabled", 1: "Enabled" }[dntStatus] || "Unspecified";
  }
  return dntStatus === "Enabled" ? true : false;
}

// This function consolidates parameters
// for the initial ping to FxA metrics endpoint
// we want to send UTMs, entrypoint and formType
// UTMs are added as default values if they don't
// exist on the window
// see https://mozilla.github.io/ecosystem-platform/docs/relying-parties/metrics-for-relying-parties
function setFxAInitialParams() {
  const utms = ["source", "campaign", "content", "term", "medium"];
  const params = new URLSearchParams(window.location.search);
  // fxa will keep the most recent set of params until they are replaced
  // by flushing them here
  utms.forEach((type) => {
    if (!params.has(`utm_${type}`)) {
      params.append(`utm_${type}`, "fpn-default");
    }
  });
  params.set("entrypoint", "fpn-site-visit");
  params.set("form_type", "button");
  return params;
}

// This adds flow information to the window. The click handler of the fxa
// subscription links will pick them up and add them to the query paramenters.
// This give funnel from the landing page to through the fxa lifecycle.
function setFxAFlowParams(data) {
  window.fxaFlowParams = data;
}

// This sets up the FxA funnel for both the proxy and the VPN
// first we check storage to see if we've collected flow data
// in the last 31 days...If so, we pull it out of storate and
// and append params to fxa links for the vpn
// If we don't have these params, we go fetch them,
// then set them in storage and appen them to fxa links (if any)
// Using localstorage with a 31 day window lets the VPN fetch and use
// the fxa flow params using a content script
// here: https://github.com/mozilla/secure-proxy/blob/master/src/content/fetch-fxa-flow-params.js
async function initiateFxAMetrics() {
  let flowInfo;
  const store = window.localStorage;
  const storedFlowInfo = store.getItem("flowInfo") || null;
  // check if we have stored flow info in the last 31 days
  // and just return if we have
  if (storedFlowInfo !== null && storedFlowInfo !== "err") {
    flowInfo = JSON.parse(storedFlowInfo);
    const now = new Date();
    const lastFetch = now.getTime() - flowInfo.flowBeginTime;
    if (lastFetch < 31 * 24 * 60 * 60 * 1000) {
      setFxAFlowParams(flowInfo);
      return;
    }
  }

  try {
    const fxaMeta = document.querySelector("meta[name='fxa']");
    const fxaUrl = fxaMeta && fxaMeta.content;
    if (!fxaUrl) {
      return;
    }
    const initialFlowParams = setFxAInitialParams();
    const res = await fetch(`${fxaUrl}metrics-flow/?${initialFlowParams.toString()}`, {
      mode: "cors",
    });
    flowInfo = await res.json();
    setFxAFlowParams(flowInfo);
    store.setItem("flowInfo", JSON.stringify(flowInfo));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    store.setItem("flowInfo", "err");
  }
}

function initiatePostHogAnalytics() {
  if (_dntEnabled()) {
    return;
  }
 !(function (t, e) {
   var o, n, p, r;
   e.__SV ||
     ((window.posthog = e),
     (e._i = []),
     (e.init = function (i, s, a) {
       function g(t, e) {
         var o = e.split(".");
         2 == o.length && ((t = t[o[0]]), (e = o[1])),
           (t[e] = function () {
             t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
           });
       }
       ((p = t.createElement("script")).type = "text/javascript"),
         (p.async = !0),
         (p.src = s.api_host + "/static/array.js"),
         (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(
           p,
           r
         );
       var u = e;
       for (
         void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
           u.people = u.people || [],
           u.toString = function (t) {
             var e = "posthog";
             return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
           },
           u.people.toString = function () {
             return u.toString(1) + ".people (stub)";
           },
           o =
             "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags".split(
               " "
             ),
           n = 0;
         n < o.length;
         n++
       )
         g(u, o[n]);
       e._i.push([i, s, a]);
     }),
     (e.__SV = 1));
 })(document, window.posthog || []);
window.posthog.init("posthog token",{api_host:"https://app.posthog.com"})
}


(function () {
  document.addEventListener("DOMContentLoaded", () => {
     initiatePostHogAnalytics();
   });
})();

