(function() {
  const clone = document.body.cloneNode(true);

  const scripts = clone.querySelectorAll('script, style, img, svg, noscript');
  scripts.forEach(el => el.remove());

  const content = clone.innerText;
  const cleaned = content
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim();

  return cleaned;
})();