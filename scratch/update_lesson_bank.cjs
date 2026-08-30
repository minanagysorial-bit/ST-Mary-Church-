const fs = require('fs');

const filePath = 'src/pages/servant/LessonBankPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const hymnsCode = fs.readFileSync('scratch/hymns_code.txt', 'utf8');

// Replace DEFAULT_HYMNS_PPT definition
const startMarker = 'const DEFAULT_HYMNS_PPT: HymnPptResource[] = [';
const endMarker = '];\n\n// Helper to sanitize Google Drive links into view/embed URLs';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers for DEFAULT_HYMNS_PPT');
  process.exit(1);
}

content = content.substring(0, startIdx) + hymnsCode + content.substring(endIdx + 2);

// Update categories in filter:
const oldCategories = "['الكل', 'ترانيم مدارس الأحد', 'ترانيم السيدة العذراء', 'ترانيم الصليب والقيامة', 'ترانيم شبابية وتأمل']";
const newCategories = "['الكل', 'ترانيم مدارس الأحد', 'ترانيم السيدة العذراء والكنيسة', 'ترانيم شبابية وتأمل', 'ترانيم التوبة والتسليم', 'ترانيم التعزية والرجاء', 'صلوات الأجبية والعروض']";

if (content.includes(oldCategories)) {
  content = content.replace(oldCategories, newCategories);
  console.log('Categories updated in filter!');
}

// Update formatDriveLinks to include downloadUrl
const oldFormat = `function formatDriveLinks(rawUrl: string) {
  if (!rawUrl) return { viewUrl: '#', embedUrl: '#' };
  let fileId = '';
  
  const idMatch = rawUrl.match(/(?:file\\/d\\/|id=|folders\\/)([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    fileId = idMatch[1];
  }

  if (fileId) {
    return {
      viewUrl: rawUrl.startsWith('http') ? rawUrl : \`https://\${rawUrl}\`,
      embedUrl: \`https://drive.google.com/file/d/\${fileId}/preview\`
    };
  }

  return {
    viewUrl: rawUrl,
    embedUrl: rawUrl
  };
}`;

const newFormat = `function formatDriveLinks(rawUrl: string) {
  if (!rawUrl) return { fileId: '', viewUrl: '#', embedUrl: '#', downloadUrl: '#' };
  let fileId = '';
  
  const idMatch = rawUrl.match(/(?:file\\/d\\/|id=|folders\\/)([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    fileId = idMatch[1];
  }

  if (fileId) {
    return {
      fileId,
      viewUrl: rawUrl.startsWith('http') ? rawUrl : \`https://\${rawUrl}\`,
      embedUrl: \`https://drive.google.com/file/d/\${fileId}/preview\`,
      downloadUrl: \`https://drive.google.com/uc?export=download&id=\${fileId}\`
    };
  }

  return {
    fileId: '',
    viewUrl: rawUrl,
    embedUrl: rawUrl,
    downloadUrl: rawUrl
  };
}`;

if (content.includes(oldFormat)) {
  content = content.replace(oldFormat, newFormat);
  console.log('formatDriveLinks updated!');
}

// Add the banner above the hymns grid
const oldHymnsGrid = `{/* TAB 3: HYMNS POWERPOINT FROM GOOGLE DRIVE */}
        {activeTab === 'hymns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;

const newHymnsGrid = `{/* TAB 3: HYMNS POWERPOINT FROM GOOGLE DRIVE */}
        {activeTab === 'hymns' && (
          <div className="space-y-6">
            {/* Google Drive Main Folder Banner */}
            <div className="p-5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/80 border-2 border-orange-300/80 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 text-right">
                <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                  <Presentation className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-tajawal text-base font-extrabold text-orange-950">
                    مجلد ترانيم الباوربوينت على Google Drive ({filteredHymns.length} ترنيمة وصلاة)
                  </h4>
                  <p className="text-xs text-orange-800 font-semibold mt-0.5">
                    عروض تقديمية PPTX جاهزة للشاشات والبروجكتور في مدارس الأحد وصلوات الأجبية والنهضات.
                  </p>
                </div>
              </div>
              <a
                href="https://drive.google.com/drive/folders/1rxTUSTGQEoxAwkk-yj_FQV14-1Q3MSKo?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95"
              >
                <FolderPlus className="w-4 h-4 text-orange-200" />
                <span>فتح المجلد الكامل على Drive ↗</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;

if (content.includes(oldHymnsGrid)) {
  content = content.replace(oldHymnsGrid, newHymnsGrid);
  // Also close the extra div
  content = content.replace('          </div>\n        )}\n\n        {/* MODAL 1: ADD LESSON', '          </div>\n          </div>\n        )}\n\n        {/* MODAL 1: ADD LESSON');
  console.log('Hymns banner and grid updated!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated LessonBankPage.tsx with all 21 hymns!');
