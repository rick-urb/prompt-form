import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(request, response) {
  const { method } = request;

  try {
    if (method === 'GET') {
      // List all templates
      const templatesData = await redis.hgetall('templates');
      if (!templatesData) return response.status(200).json([]);
      const templatesArray = Object.entries(templatesData).map(([id, data]) => {
        try {
          const template = JSON.parse(data);
          return { id, ...template };
        } catch (e) {
          return { id, name: id, content: data };
        }
      });
      return response.status(200).json(templatesArray);
    } else if (method === 'POST') {
      // Add a new template
      const { name, content } = request.body;
      if (!name || !content) {
        return response.status(400).json({ error: 'Name and content are required' });
      }
      const id = `template_${Date.now()}`;
      const templateData = JSON.stringify({ name, content });
      await redis.hset('templates', { [id]: templateData });
      return response.status(201).json({ id, name, content });
    } else if (method === 'PUT') {
      // Update a template
      const { id, name, content } = request.body;
      if (!id || !name || !content) {
        return response.status(400).json({ error: 'ID, name, and content are required' });
      }
      const templateData = JSON.stringify({ name, content });
      await redis.hset('templates', { [id]: templateData });
      return response.status(200).json({ id, name, content });
    } else if (method === 'DELETE') {
      // Delete a template
      const { id } = request.body;
      if (!id) {
        return response.status(400).json({ error: 'ID is required' });
      }
      await redis.hdel('templates', id);
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