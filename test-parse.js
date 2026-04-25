const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('attendance-test2.html', 'utf8');

if (html.includes("txtUsername") || html.includes("login-box")) {
  console.log("INVALID_CREDENTIALS detected in HTML");
}

const $ = cheerio.load(html);
const subjects = [];

$('table tr').each((i, el) => {
  const td = $(el).find('td');
  if (td.length >= 4) {
    const name = $(td[1]).text().trim();
    const present = parseInt($(td[2]).text().trim()) || 0;
    const absent = parseInt($(td[3]).text().trim()) || 0;
    
    if (name && !isNaN(present) && name !== "Subject Name") {
      const total = present + absent;
      subjects.push({
        name,
        present,
        absent,
        percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0",
        margin: Math.floor((present / 0.75) - total) // Bunk Margin
      });
    }
  }
});

console.log('Parsed subjects:', subjects);
