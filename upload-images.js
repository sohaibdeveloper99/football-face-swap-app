const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration - Using anon key with public bucket
const supabaseUrl = 'https://vxwtwerojlaccjqkjupe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4d3R3ZXJvamxhY2NqcWtqdXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjA2MDYsImV4cCI6MjA3NjE5NjYwNn0.BbJXux6ojpG0N6x2E3XBdVzG_TBkHgGyNUs5Xg2R9D4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImages() {
  console.log('🚀 Starting image upload to Supabase Storage...\n');
  
  // Upload jerseys
  const jerseysPath = path.join(__dirname, 'public', 'jerseys');
  if (fs.existsSync(jerseysPath)) {
    const jerseyFiles = fs.readdirSync(jerseysPath).filter(file => 
      /\.(jpg|jpeg|png|avif)$/i.test(file)
    );
    
    console.log(`📁 Found ${jerseyFiles.length} jersey images`);
    
    let uploaded = 0;
    let failed = 0;
    
    for (const file of jerseyFiles) {
      const filePath = path.join(jerseysPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      try {
        const { data, error } = await supabase.storage
          .from('jerseys')
          .upload(file, fileBuffer, {
            contentType: `image/${path.extname(file).slice(1).toLowerCase()}`,
            upsert: true
          });
        
        if (error) {
          console.log(`❌ ${file}: ${error.message}`);
          failed++;
        } else {
          console.log(`✅ ${file}`);
          uploaded++;
        }
      } catch (err) {
        console.log(`❌ ${file}: ${err.message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Jerseys: ${uploaded} uploaded, ${failed} failed\n`);
  }
  
  // Upload faces
  const facesPath = path.join(__dirname, 'public', 'faces');
  if (fs.existsSync(facesPath)) {
    const faceFiles = fs.readdirSync(facesPath).filter(file => 
      /\.(jpg|jpeg|png|avif)$/i.test(file)
    );
    
    console.log(`📁 Found ${faceFiles.length} face images`);
    
    let uploaded = 0;
    let failed = 0;
    
    for (const file of faceFiles) {
      const filePath = path.join(facesPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      try {
        const { data, error } = await supabase.storage
          .from('faces')
          .upload(file, fileBuffer, {
            contentType: `image/${path.extname(file).slice(1).toLowerCase()}`,
            upsert: true
          });
        
        if (error) {
          console.log(`❌ ${file}: ${error.message}`);
          failed++;
        } else {
          console.log(`✅ ${file}`);
          uploaded++;
        }
      } catch (err) {
        console.log(`❌ ${file}: ${err.message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Faces: ${uploaded} uploaded, ${failed} failed`);
  }
  
  console.log('\n🎉 Upload process completed!');
  console.log('\nNext steps:');
  console.log('1. Check your Supabase Storage dashboard');
  console.log('2. Update your app to use Supabase URLs');
  console.log('3. Test image loading');
}

uploadImages().catch(console.error);









