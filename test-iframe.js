(async () => {
  const url = 'https://academia.srmist.edu.in/accounts/p/10002227248/signin?hide_fp=true&orgtype=40&service_language=en&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin';
  const r = await fetch(url);
  const t = await r.text();
  const matches = [...t.matchAll(/<input[^>]+type=["']?hidden["']?[^>]*>/ig)];
  console.log(matches.map(m => m[0]).join('\n'));
})();
