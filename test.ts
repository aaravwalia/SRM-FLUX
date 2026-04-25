async function run() {
  const r = await fetch('https://academia.srmist.edu.in/');
  const t = await r.text();
  console.log(t.substring(0, 500));
  const matches = [...t.matchAll(/<input[^>]+name=["']?([^"'\s>]+)["']?[^>]*>/ig)];
  console.log(matches.map(m => m[1]).join(', '));
}
run();
