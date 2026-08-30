const fs = require('fs');
const hymns = JSON.parse(fs.readFileSync('scratch/hymns_generated.json', 'utf8'));

let ts = 'const DEFAULT_HYMNS_PPT: HymnPptResource[] = [\n';
hymns.forEach(h => {
  ts += '  {\n';
  ts += `    id: '${h.id}',\n`;
  ts += `    title: '${h.title}',\n`;
  ts += `    category: '${h.category}',\n`;
  ts += `    drive_url: '${h.drive_url}',\n`;
  ts += `    lyrics_snippet: '${h.lyrics_snippet.replace(/'/g, "\\'")}',\n`;
  ts += `    created_at: '${h.created_at}'\n`;
  ts += '  },\n';
});
ts += '];';

fs.writeFileSync('scratch/hymns_code.txt', ts, 'utf8');
console.log('Successfully generated scratch/hymns_code.txt');
