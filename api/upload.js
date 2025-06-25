import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false, // Turn off body parser to handle file streams
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const filename = request.headers['x-vercel-filename'] || 'file.jpg';

  try {
    const blob = await put(filename, request, {
      access: 'public',
    });
    return response.status(200).json(blob);
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return response.status(500).json({ error: 'Failed to upload file.' });
  }
} 