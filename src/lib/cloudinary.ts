export async function uploadImage(file: File): Promise<string> {
  const cloudName = "ddsikz7wq";
  const apiKey = "728859884445323";
  const apiSecret = "qJBcAxrhV_loi85MYP8OK_F_IcY";

  const timestamp = Math.round(new Date().getTime() / 1000);

  const strToSign = `timestamp=${timestamp}${apiSecret}`;
  const msgBuffer = new TextEncoder().encode(strToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to upload image");

  const data = await response.json();
  return data.secure_url;
}

export function extractCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryImage(url: string): Promise<void> {
  if (!url || !url.includes("cloudinary.com")) return;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return;
  try {
    await fetch("/api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId }),
    });
  } catch {
    // silent — deletion failure should not block UI flow
  }
}
