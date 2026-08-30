const https = require('https');
const fs = require('fs');

const url = 'https://drive.google.com/drive/folders/1rxTUSTGQEoxAwkk-yj_FQV14-1Q3MSKo';

function fetchDrive(targetUrl) {
  https.get(targetUrl, { 
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
    } 
  }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      return fetchDrive(res.headers.location);
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Data length:', data.length);

      const titleMatch = data.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) console.log('Page Title:', titleMatch[1]);

      fs.writeFileSync('scratch/drive_page.html', data);
      console.log('Saved to scratch/drive_page.html');
    });
  }).on('error', err => console.error(err));
}

fetchDrive(url);
