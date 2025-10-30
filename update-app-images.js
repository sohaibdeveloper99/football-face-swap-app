const fs = require('fs');
const path = require('path');

// Read the App.js file
const appJsPath = path.join(__dirname, 'src', 'App.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// Replace all selectJersey calls with file names only
content = content.replace(/selectJersey\('([^']+)', '\/jerseys\/([^']+)', '\/faces\/([^']+)'\)/g, "selectJersey('$1', '$2', '$3')");

// Replace all jersey image src patterns
content = content.replace(/src="\/jerseys\/([^"]+)"/g, 'src={getJerseyImageUrl(\'$1\')}');

// Replace all face image src patterns  
content = content.replace(/src="\/faces\/([^"]+)"/g, 'src={getFaceImageUrl(\'$1\')}');

// Write the updated content back
fs.writeFileSync(appJsPath, content, 'utf8');

console.log('✅ Updated App.js to use Supabase URLs');