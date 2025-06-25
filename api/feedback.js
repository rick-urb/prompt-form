import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(request, response) {
  const { method } = request;

  try {
    if (method === 'GET') {
      const notesData = await redis.hgetall('notes');
      if (!notesData) {
        return response.status(200).json([]);
      }
      // hgetall returns an object, parse each value from a JSON string
      const notesArray = Object.entries(notesData).map(([id, data]) => {
          try {
            // New format: data is a JSON string
            const note = JSON.parse(data);
            return { id, text: note.text, imageUrl: note.imageUrl };
          } catch (e) {
            // Old format: data is a plain string
            return { id, text: data, imageUrl: null };
          }
      });
      return response.status(200).json(notesArray);
    } else if (method === 'POST') {
      const { text, imageUrl } = request.body;
      if (!text) {
        return response.status(400).json({ error: 'Text is required' });
      }
      const id = `note_${Date.now()}`;
      const noteData = JSON.stringify({ text, imageUrl: imageUrl || null });
      await redis.hset('notes', { [id]: noteData });
      return response.status(201).json({ id, text, imageUrl: imageUrl || null });
    } else if (method === 'PUT') {
        const { id, text, imageUrl } = request.body;
        if (!id || !text) {
            return response.status(400).json({ error: 'ID and text are required' });
        }
        const noteData = JSON.stringify({ text, imageUrl: imageUrl || null });
        await redis.hset('notes', { [id]: noteData });
        return response.status(200).json({ id, text, imageUrl: imageUrl || null });
    } else if (method === 'DELETE') {
        const { id } = request.body;
        if (!id) {
            return response.status(400).json({ error: 'ID is required' });
        }
        await redis.hdel('notes', id);
        return response.status(204).end();
    } else {
      response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return response.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Redis error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
} 