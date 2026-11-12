// Minimal viewer for the .dc.html boards: runs each board's logic class with its default
// props and fills {{holes}}, <sc-for> and <sc-if>. For local viewing only; not production code.
(function () {
  var tpl = document.getElementById('dc-tpl');
  var root = document.getElementById('dc-root');
  var script = document.querySelector('script[type="text/x-dc"]');
  var props = {};
  if (script) {
    try {
      var spec = JSON.parse(script.getAttribute('data-props') || '{}');
      Object.keys(spec).forEach(function (k) { if (k[0] !== '$' && spec[k] && 'default' in spec[k]) props[k] = spec[k].default; });
    } catch (e) { console.warn('props', e); }
  }
  function DCLogic(p) { this.props = p || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) { Object.assign(this.state, patch); render(); };
  var inst = null;
  if (script && /class\s+Component/.test(script.textContent)) {
    try {
      var Cls = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
      inst = new Cls(props);
    } catch (e) { console.warn('logic', e); }
  }
  function lookup(path, scopes) {
    path = path.trim();
    if (path === 'true') return true; if (path === 'false') return false;
    var parts = path.split('.');
    for (var i = scopes.length - 1; i >= 0; i--) {
      var s = scopes[i];
      if (s && parts[0] in s) { var v = s[parts[0]]; for (var j = 1; j < parts.length; j++) v = v == null ? v : v[parts[j]]; return v; }
    }
    return undefined;
  }
  var HOLE = /\{\{([^}]+)\}\}/g;
  function fill(str, scopes) { return str.replace(HOLE, function (_, p) { var v = lookup(p, scopes); return v == null ? '' : (typeof v === 'function' ? '' : String(v)); }); }
  function walk(node, scopes, out) {
    if (node.nodeType === 3) { out.appendChild(document.createTextNode(fill(node.nodeValue, scopes))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var m = (node.getAttribute('list') || '').match(/\{\{([^}]+)\}\}/);
      var list = m ? lookup(m[1], scopes) : [];
      var as = node.getAttribute('as') || 'item';
      (list || []).forEach(function (item) { var sc = {}; sc[as] = item; node.childNodes.forEach(function (c) { walk(c, scopes.concat([sc]), out); }); });
      return;
    }
    if (tag === 'sc-if') {
      var mm = (node.getAttribute('value') || '').match(/\{\{([^}]+)\}\}/);
      if (mm && lookup(mm[1], scopes)) node.childNodes.forEach(function (c) { walk(c, scopes, out); });
      return;
    }
    var el = node.namespaceURI === 'http://www.w3.org/1999/xhtml' ? document.createElement(node.localName) : document.createElementNS(node.namespaceURI, node.localName);
    Array.prototype.forEach.call(node.attributes, function (a) {
      var m2 = a.value.match(/^\{\{([^}]+)\}\}$/);
      if (/^on/i.test(a.name) && m2) { var fn = lookup(m2[1], scopes); if (typeof fn === 'function') el.addEventListener(a.name.slice(2).toLowerCase(), fn); return; }
      el.setAttribute(a.name, fill(a.value, scopes));
    });
    node.childNodes.forEach(function (c) { walk(c, scopes, el.content ? el.content : el); });
    out.appendChild(el);
  }
  function render() {
    var vals = {};
    if (inst && inst.renderVals) { try { vals = inst.renderVals() || {}; } catch (e) { console.warn('renderVals', e); } }
    var scopes = [props, vals];
    var frag = document.createDocumentFragment();
    tpl.content.childNodes.forEach(function (c) { walk(c, scopes, frag); });
    root.replaceChildren(frag);
  }
  render();
})();
