import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadAsset(filePath, publicId) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'artifix/email',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    type: 'upload',
    access_mode: 'public',
  });
  return result.secure_url;
}

async function main() {
  const assetsDir = path.resolve('frontend/public/images/email');
  const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  const urls = {};
  for (const file of files) {
    const fullPath = path.join(assetsDir, file);
    const id = path.parse(file).name;
    try {
      console.log(`Uploading ${file}...`);
      const url = await uploadAsset(fullPath, id);
      urls[file] = url;
      console.log(`Uploaded ${file} -> ${url}`);
    } catch (err) {
      console.error(`Failed ${file}:`, err.message);
    }
  }
  fs.writeFileSync('scripts/uploaded_email_assets.json', JSON.stringify(urls, null, 2));
  console.log('Finished uploading assets to Cloudinary!');
}

if (process.argv[1] && process.argv[1].endsWith('upload_email_assets.mjs')) {
  main().catch(console.error);
}
