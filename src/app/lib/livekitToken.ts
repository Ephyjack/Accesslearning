// src/app/lib/livekitToken.ts
// Utility to generate LiveKit Access Tokens securely using Web Crypto API.
// Note: In an ideal production environment, this should sit on an Edge Function.
// For full backend prototyping in Vite, this safely signs the JWT natively in the browser.

const textEncoder = new TextEncoder();

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  isTeacher: boolean
): Promise<string> {
  // Read secrets from environment. Support VITE_ or NEXT_PUBLIC_ prefixes.
  const env = (import.meta as any).env;
  const apiKey = env.VITE_LIVEKIT_API_KEY || env.NEXT_PUBLIC_LIVEKIT_API_KEY || "APINoAoSng8zYgT";
  const apiSecret = env.VITE_LIVEKIT_SECRET || env.NEXT_PUBLIC_LIVEKIT_SECRET || "HI1n7RwDauUjODzD5a0QivdwSMwFqmolV2Y9S95M0HD";

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit API Key or Secret is missing in environment variables.");
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    exp: now + 60 * 60 * 6, // 6 hours
    iss: apiKey,
    nbf: now,
    sub: participantIdentity,
    name: participantName,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isTeacher,
    },
  };

  const encodedHeader = base64UrlEncode(textEncoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(dataToSign)
  );

  const encodedSignature = base64UrlEncode(signature);
  return `${dataToSign}.${encodedSignature}`;
}
