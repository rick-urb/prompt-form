import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const a_day_in_seconds = 86400;

export default async function handler(request, response) {
  const { method } = request;

  try {
    if (method === 'GET') {
      const elementsData = await redis.hgetall('prompt_elements');
      if (!elementsData) {
        return response.status(200).json([]);
      }
      const elementsArray = Object.entries(elementsData)
        .map(([id, data]) => {
          try {
            return { id, ...JSON.parse(data) };
          } catch (e) {
            // Skip invalid/corrupt entries
            return null;
          }
        })
        .filter(Boolean);
      return response.status(200).json(elementsArray);

    } else if (method === 'POST') {
      const { type, text, options, order } = request.body;
      const id = `element_${Date.now()}`;
      const elementData = JSON.stringify({ type, text, options, order });

      await redis.hset('prompt_elements', id, elementData);
      return response.status(201).json({ id, type, text, options, order });

    } else if (method === 'PUT') {
      const { id, text, options, order } = request.body;
      if (!id) {
        return response.status(400).json({ error: 'ID is required' });
      }
      // First, get the existing element to preserve its type
      const existingData = await redis.hget('prompt_elements', id);
      if (!existingData) {
          return response.status(404).json({ error: 'Element not found' });
      }
      const existingElement = JSON.parse(existingData);

      const elementData = JSON.stringify({ 
          type: existingElement.type, 
          text: text, 
          options: options,
          order: order,
      });
      await redis.hset('prompt_elements', id, elementData);
      return response.status(200).json({ id, ...JSON.parse(elementData) });

    } else if (method === 'DELETE') {
      const { id } = request.body;
      if (!id) {
        return response.status(400).json({ error: 'ID is required' });
      }
      await redis.hdel('prompt_elements', id);
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