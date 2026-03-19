export async function uploadImage(file: File): Promise<string> {
  const cloudName = "ddsikz7wq";
  const apiKey = "728859884445323";
  const apiSecret = "qJBcAxrhV_loi85MYP8OK_F_IcY";

  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // Create signature
  // In a real app, this should be done on the server, but per user request, we do it here
  const strToSign = `timestamp=${timestamp}${apiSecret}`;
  
  // Simple SHA-1 hash function for the browser
  const msgBuffer = new TextEncoder().encode(strToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = await response.json();
  return data.secure_url;
}
