(function() {
  const content = document.body.innerText;
  const cleaned = content
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
})();