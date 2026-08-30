const fs = require('fs');

const html = fs.readFileSync('scratch/drive_page.html', 'utf8');

// Look for file names and IDs in Google Drive's initial data payload
const items = [];

// Regular expression to find files inside Google Drive JS data blobs
// Usually in format [null, "File Name.pptx", "mimeType", null, "fileId", ...] or similar
const pptxRegex = /\["([a-zA-Z0-9_-]{25,})",\["([^"]+\.pptx?)"/g;
let m;
while ((m = pptxRegex.exec(html)) !== null) {
  items.push({ id: m[1], name: m[2] });
}

// Another common pattern: ["File Name.pptx", ... "ID"] or [..., "id", "name"]
const pattern2 = /"([a-zA-Z0-9_-]{28,35})"[^\]]+"([^"]+\.(?:pptx?|ppt|pdf))"/g;
while ((m = pattern2.exec(html)) !== null) {
  items.push({ id: m[1], name: m[2] });
}

// Let's also search broadly for any .ppt or .pptx string in the file
const allPpt = [];
const broadRegex = /"([^"\\]+\.(?:pptx?|ppt))"/gi;
while ((m = broadRegex.exec(html)) !== null) {
  if (!allPpt.includes(m[1])) allPpt.push(m[1]);
}

console.log('Total broad PPT filenames found:', allPpt.length);
console.log('Sample broad filenames:', allPpt.slice(0, 40));

// Also let's inspect subfolders or files
const folderMatch = html.match(/\["([a-zA-Z0-9_-]{25,})",\["([^"]+)"/g);
console.log('Folder/item patterns count:', folderMatch ? folderMatch.length : 0);
if (folderMatch) {
  console.log('Sample folder patterns:', folderMatch.slice(0, 15));
}
