const cloudName = 'ddsikz7wq';
const apiKey = '728859884445323';
const apiSecret = 'qJBcAxrhV_loi85MYP8OK_F_IcY';

// Helper function to generate SHA-1 signature for Cloudinary Authentication
async function generateSignature(paramsToSign: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(paramsToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadImage(file: File): Promise<string | null> {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const folder = 'kace_gaming';
    
    // Cloudinary requires parameters to be sorted alphabetically for the signature
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = await generateSignature(stringToSign);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary direct upload failed: ${res.status} ${text}`);
    }
    
    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image directly:', error);
    return null;
  }
}

export async function deleteImage(url: string | null) {
  if (!url || !url.includes('cloudinary.com')) return;
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return;
    
    const pathParts = parts.slice(uploadIndex + 2);
    const fullPath = pathParts.join('/');
    const publicId = fullPath.split('.')[0]; // e.g., folder/image
    
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    // Cloudinary requires parameters to be sorted alphabetically for the signature
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await generateSignature(stringToSign);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Direct delete failed: ${res.status} ${text}`);
    }
  } catch (error) {
    console.error('Error directly deleting image:', error);
  }
}
