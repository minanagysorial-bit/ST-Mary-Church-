const fs = require('fs');

const html = fs.readFileSync('scratch/drive_page.html', 'utf8');

// Match aria-label="FILENAME" ... ssk='...:FILEID-...'
const regex = /aria-label="([^"]+)\.pptx?[^"]*"\s+[^>]*ssk='[^':]+:[^':]+:([a-zA-Z0-9_-]{25,})-[^']*'/gi;

// Also match reversed: ssk='...:FILEID-...' ... aria-label="FILENAME"
const regex2 = /ssk='[^':]+:[^':]+:([a-zA-Z0-9_-]{25,})-[^']*'[^>]*aria-label="([^"]+)\.pptx?[^"]*"/gi;

const items = [];
const seen = new Set();

let m;
while ((m = regex.exec(html)) !== null) {
  const name = m[1].trim();
  const id = m[2];
  if (!seen.has(name)) {
    seen.add(name);
    items.push({ name, id });
  }
}

while ((m = regex2.exec(html)) !== null) {
  const id = m[1];
  const name = m[2].trim();
  if (!seen.has(name)) {
    seen.add(name);
    items.push({ name, id });
  }
}

// Fallback search around aria-label
const labelRegex = /aria-label="([^"]+\.pptx?)[^"]*"/gi;
while ((m = labelRegex.exec(html)) !== null) {
  const filename = m[1].trim();
  const cleanName = filename.replace(/\.pptx?/i, '').trim();
  if (!seen.has(cleanName)) {
    const idx = m.index;
    const chunk = html.substring(Math.max(0, idx - 150), Math.min(html.length, idx + 250));
    const sskMatch = chunk.match(/ssk='[^':]+:[^':]+:([a-zA-Z0-9_-]{25,})-[^']*'/);
    if (sskMatch) {
      seen.add(cleanName);
      items.push({ name: cleanName, id: sskMatch[1] });
    }
  }
}

console.log('Total items matched with IDs:', items.length);
console.log(JSON.stringify(items, null, 2));

fs.writeFileSync('scratch/drive_items.json', JSON.stringify(items, null, 2));
