const fs = require('fs');
const path = require('path');

const replacements = {
  '??': '<i className=\"bi bi-bus-front\"></i>',
  '?': '<i className=\"bi bi-arrow-right\"></i>',
  '??': '<i className=\"bi bi-calendar3\"></i>',
  '???': '<i className=\"bi bi-map\"></i>',
  '??': '<i className=\"bi bi-credit-card\"></i>',
  '??': '<i className=\"bi bi-exclamation-triangle-fill\"></i>',
  '??': '<i className=\"bi bi-stopwatch\"></i>',
  '??': '<i className=\"bi bi-car-front-fill\"></i>',
  '??': '<i className=\"bi bi-whatsapp\"></i>',
  '??': '<i className=\"bi bi-leaf\"></i>',
  '???': '<i className=\"bi bi-shield-check\"></i>',
  '??': '<i className=\"bi bi-person-arms-up\"></i>',
  '??': '<i className=\"bi bi-geo-alt-fill\"></i>',
  '??': '<i className=\"bi bi-facebook\"></i>',
  '??': '<i className=\"bi bi-instagram\"></i>',
  '??': '<i className=\"bi bi-check-square\"></i>',
  '??': '<i className=\"bi bi-search\"></i>',
  '??': '<i className=\"bi bi-phone\"></i>',
  '?': '<i className=\"bi bi-clock\"></i>'
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const [emoji, icon] of Object.entries(replacements)) {
    if (content.includes(emoji)) {
      content = content.split(emoji).join(icon);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
