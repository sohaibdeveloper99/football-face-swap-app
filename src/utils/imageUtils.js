import { supabase } from '../lib/supabase';

/**
 * Get public URL for a jersey image from Supabase Storage
 * @param {string} imageName - Name of the jersey image file
 * @returns {string} Public URL for the image
 */
export const getJerseyImageUrl = (imageName) => {
  const { data } = supabase.storage.from('jerseys').getPublicUrl(imageName);
  return data.publicUrl;
};

/**
 * Get public URL for a face image from Supabase Storage
 * @param {string} imageName - Name of the face image file
 * @returns {string} Public URL for the image
 */
export const getFaceImageUrl = (imageName) => {
  const { data } = supabase.storage.from('faces').getPublicUrl(imageName);
  return data.publicUrl;
};

/**
 * Get public URL for any image from a specific bucket
 * @param {string} bucketName - Name of the storage bucket
 * @param {string} imageName - Name of the image file
 * @returns {string} Public URL for the image
 */
export const getImageUrl = (bucketName, imageName) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(imageName);
  return data.publicUrl;
};

/**
 * List all images in a bucket
 * @param {string} bucketName - Name of the storage bucket
 * @returns {Promise<Array>} Array of image objects
 */
export const listImages = async (bucketName) => {
  const { data, error } = await supabase.storage.from(bucketName).list('', {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' }
  });
  
  if (error) {
    console.error(`Error listing images from ${bucketName}:`, error);
    return [];
  }
  
  return data || [];
};

/**
 * Get all jersey images with their URLs
 * @returns {Promise<Array>} Array of jersey objects with name and URL
 */
export const getAllJerseyImages = async () => {
  const images = await listImages('jerseys');
  return images.map(image => ({
    name: image.name,
    url: getJerseyImageUrl(image.name)
  }));
};

/**
 * Get all face images with their URLs
 * @returns {Promise<Array>} Array of face objects with name and URL
 */
export const getAllFaceImages = async () => {
  const images = await listImages('faces');
  return images.map(image => ({
    name: image.name,
    url: getFaceImageUrl(image.name)
  }));
};









