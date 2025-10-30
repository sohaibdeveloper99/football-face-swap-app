-- Enable public access for jerseys bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'jerseys';

-- Enable public access for faces bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'faces';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public uploads for jerseys" ON storage.objects;
DROP POLICY IF EXISTS "Public read for jerseys" ON storage.objects;
DROP POLICY IF EXISTS "Public uploads for faces" ON storage.objects;
DROP POLICY IF EXISTS "Public read for faces" ON storage.objects;

-- Allow public uploads to jerseys
CREATE POLICY "Public uploads for jerseys"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'jerseys' );

-- Allow public read access to jerseys
CREATE POLICY "Public read for jerseys"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'jerseys' );

-- Allow public uploads to faces
CREATE POLICY "Public uploads for faces"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'faces' );

-- Allow public read access to faces
CREATE POLICY "Public read for faces"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'faces' );

