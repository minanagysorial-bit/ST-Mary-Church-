async function checkDeploy() {
  try {
    const res = await fetch('https://www.tibarthenos.com/?t=' + Date.now());
    const html = await res.text();
    console.log('Production HTML includes apple-touch-icon.png:', html.includes('apple-touch-icon.png'));
    
    const bundleMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    console.log('Current Deployed Main Bundle:', bundleMatch ? bundleMatch[1] : 'NOT FOUND');

    if (bundleMatch) {
      const jsRes = await fetch('https://www.tibarthenos.com' + bundleMatch[1]);
      const jsText = await jsRes.text();
      console.log('JS contains white compact app box:', jsText.includes('تطبيق الهاتف المحمول'));
    }
  } catch (e) {
    console.error(e);
  }
}
checkDeploy();
