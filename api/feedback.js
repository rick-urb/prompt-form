import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(request, response) {
  const { method } = request;

  try {
    if (method === 'GET') {
      const notes = await redis.hgetall('notes');
      // hgetall returns an object, convert it to an array of objects
      const notesArray = notes ? Object.entries(notes).map(([id, text]) => ({ id, text })) : [];
      return response.status(200).json(notesArray);
    } else if (method === 'POST') {
      const { text } = request.body;
      if (!text) {
        return response.status(400).json({ error: 'Text is required' });
      }
      const id = `note_${Date.now()}`;
      await redis.hset('notes', { [id]: text });
      return response.status(201).json({ id, text });
    } else if (method === 'PUT') {
        const { id, text } = request.body;
        if (!id || !text) {
            return response.status(400).json({ error: 'ID and text are required' });
        }
        await redis.hset('notes', { [id]: text });
        return response.status(200).json({ id, text });
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