/* ============================================================
   AEGIS website settings — the ONE place to switch things on.
   When the app is ready, paste its link between the quotes.
   Leave a link empty ("") and its button shows "Coming soon".
   ============================================================ */
window.AEGIS = {
  appUrl:  "",   // "Launch app" button  e.g. "https://app.aegisproptech.com"
  playUrl: "",   // Google Play link
  iosUrl:  "",   // Apple App Store link
  apkUrl:  ""    // direct APK download link
};

(function () {
  var C = window.AEGIS;
  var modal = document.getElementById('soon');
  function open(label) {
    if (!modal) return;
    var t = modal.querySelector('[data-t]');
    if (t) t.textContent = label ? label + ' is coming soon' : 'Coming soon';
    modal.classList.add('open');
  }
  function close() { if (modal) modal.classList.remove('open'); }

  document.querySelectorAll('[data-soon]').forEach(function (el) {
    var key = el.getAttribute('data-soon');
    var label = el.getAttribute('data-label') || '';
    var url = C[key];
    if (url) { el.setAttribute('href', url); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); return; }
    el.addEventListener('click', function (e) { e.preventDefault(); open(label); });
  });
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  var b = document.getElementById('burger'), m = document.getElementById('mnav');
  if (b && m) b.addEventListener('click', function () { m.classList.toggle('open'); });

  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  } else { els.forEach(function (e) { e.classList.add('in'); }); }

  var f = document.getElementById('cform');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(f);
    var body = 'Name: ' + d.get('name') + '\nEmail: ' + d.get('email') + '\nI am a: ' + d.get('role') + '\n\n' + d.get('msg');
    window.location.href = 'mailto:admin@aegisproptech.com?subject=' + encodeURIComponent(d.get('topic') + ' - ' + d.get('name')) + '&body=' + encodeURIComponent(body);
  });
})();
