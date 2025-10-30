const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://vxwtwerojlaccjqkjupe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4d3R3ZXJvamxhY2NqcWtqdXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjA2MDYsImV4cCI6MjA3NjE5NjYwNn0.BbJXux6ojpG0N6x2E3XBdVzG_TBkHgGyNUs5Xg2R9D4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorageBuckets() {
  console.log('Setting up Supabase Storage buckets...');
  
  try {
    // Create jerseys bucket
    const { data: jerseysBucket, error: jerseysError } = await supabase.storage.createBucket('jerseys', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/avif'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (jerseysError) {
      console.log('Jerseys bucket creation result:', jerseysError.message);
    } else {
      console.log('✅ Jerseys bucket created successfully');
    }
    
    // Create faces bucket
    const { data: facesBucket, error: facesError } = await supabase.storage.createBucket('faces', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/avif'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (facesError) {
      console.log('Faces bucket creation result:', facesError.message);
    } else {
      console.log('✅ Faces bucket created successfully');
    }
    
  } catch (error) {
    console.error('Error setting up buckets:', error);
  }
}

async function uploadImages() {
  console.log('\nStarting image upload process...');
  
  // Upload jerseys
  const jerseysPath = path.join(__dirname, 'public', 'jerseys');
  if (fs.existsSync(jerseysPath)) {
    const jerseyFiles = fs.readdirSync(jerseysPath).filter(file => 
      /\.(jpg|jpeg|png|avif)$/i.test(file)
    );
    
    console.log(`Found ${jerseyFiles.length} jersey images to upload`);
    
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
          console.log(`❌ Error uploading ${file}:`, error.message);
        } else {
          console.log(`✅ Uploaded: ${file}`);
        }
      } catch (err) {
        console.log(`❌ Failed to upload ${file}:`, err.message);
      }
    }
  }
  
  // Upload faces
  const facesPath = path.join(__dirname, 'public', 'faces');
  if (fs.existsSync(facesPath)) {
    const faceFiles = fs.readdirSync(facesPath).filter(file => 
      /\.(jpg|jpeg|png|avif)$/i.test(file)
    );
    
    console.log(`Found ${faceFiles.length} face images to upload`);
    
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
          console.log(`❌ Error uploading ${file}:`, error.message);
        } else {
          console.log(`✅ Uploaded: ${file}`);
        }
      } catch (err) {
        console.log(`❌ Failed to upload ${file}:`, err.message);
      }
    }
  }
}

async function getPublicUrls() {
  console.log('\nGetting public URLs for uploaded images...');
  
  // Get jerseys URLs
  const { data: jerseys, error: jerseysError } = await supabase.storage
    .from('jerseys')
    .list('', { limit: 10 });
  
  if (!jerseysError && jerseys) {
    console.log('\n📁 Jerseys bucket contents:');
    jerseys.forEach(file => {
      const publicUrl = supabase.storage.from('jerseys').getPublicUrl(file.name);
      console.log(`${file.name}: ${publicUrl.data.publicUrl}`);
    });
  }
  
  // Get faces URLs
  const { data: faces, error: facesError } = await supabase.storage
    .from('faces')
    .list('', { limit: 10 });
  
  if (!facesError && faces) {
    console.log('\n📁 Faces bucket contents:');
    faces.forEach(file => {
      const publicUrl = supabase.storage.from('faces').getPublicUrl(file.name);
      console.log(`${file.name}: ${publicUrl.data.publicUrl}`);
    });
  }
}

async function main() {
  console.log('🚀 Supabase Storage Setup Script');
  console.log('================================');
  
  await setupStorageBuckets();
  await uploadImages();
  await getPublicUrls();
  
  console.log('\n✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Check your Supabase dashboard to verify the buckets and files');
  console.log('2. Update your application code to use Supabase URLs instead of local paths');
  console.log('3. Test the image loading in your application');
}

main().catch(console.error);









