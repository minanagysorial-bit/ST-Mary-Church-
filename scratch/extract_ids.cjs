const fs = require('fs');

const html = fs.readFileSync('scratch/drive_page.html', 'utf8');

// Find all occurrences of PPTX and inspect the surrounding JSON structure
const regex = /\["([a-zA-Z0-9_-]{20,})",\["([^"]+\.pptx?)"/gi;

// Alternatively, let's find where the filenames appear and search for IDs around them
const filenames = [
  'ترنيمة احلى ما فى حياتى انت.PPTX',
  'ترنيمة اسمحيلى يا اكلسيا.PPTX',
  'ترنيمة أسمع صراخى يا سيدى.PPTX',
  'ترنيمة الرب قريب.PPTX',
  'ترنيمة الهنا عظيم .PPTX',
  'ترنيمة امسك يارب ايدى.PPTX',
  'ترنيمة انت قلت تعالوا.PPTX',
  'ترنيمة ايها الفخارى.PPTX',
  'ترنيمة تعالوا تعالوا.PPTX',
  'ترنيمة دايما بتخبيني.PPTX',
  'ترنيمة ضاقت الدنيا قصادى.PPTX',
  'ترنيمة طهرنى.PPTX',
  'ترنيمة علمني .PPTX',
  'ترنيمة فرحان بيك وانا ماشى معاك.PPTX',
  'ترنيمة كنيستنا دى قصة اجيال.PPTX',
  'ترنيمة لا لا تتركنى وحدى.PPTX',
  'ترنيمة لم تر عين.PPTX',
  'ترنيمة من بين القديسين .PPTX',
  'صلاة الساعة التاسعة.pptx',
  'صلاة الغروب.pptx',
  'صلاة النوم.pptx'
];

const results = [];

filenames.forEach(name => {
  const cleanName = name.replace('.PPTX', '').replace('.pptx', '').trim();
  const idx = html.indexOf(name);
  if (idx !== -1) {
    // Look backwards or forwards within 600 chars for a drive file ID (usually ~33 chars alphanumeric with _ and -)
    const chunk = html.substring(Math.max(0, idx - 400), Math.min(html.length, idx + 400));
    // Match IDs like "1a2B3c..."
    const idMatches = chunk.match(/\"([a-zA-Z0-9_-]{28,45})\"/g) || [];
    // Filter out common strings
    const candidateIds = idMatches
      .map(s => s.replace(/\"/g, ''))
      .filter(id => !id.includes('application') && !id.includes('vnd.google') && !id.includes('drive'));
    
    results.push({
      filename: name,
      title: cleanName,
      candidateIds: candidateIds.slice(0, 3)
    });
  }
});

console.log('Results with IDs:');
console.log(JSON.stringify(results.slice(0, 5), null, 2));

// Let's inspect a raw chunk around one file to see exact Google Drive data structure
const sampleIdx = html.indexOf('ترنيمة احلى ما فى حياتى انت.PPTX');
if (sampleIdx !== -1) {
  console.log('--- RAW CHUNK ---');
  console.log(html.substring(sampleIdx - 200, sampleIdx + 200));
}
