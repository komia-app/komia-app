import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SYSTEM_PROMPT = `You are MIA, the friendly AI assistant inside KOMIA, a social restaurant discovery app for Bogotá. You help users discover, save, and log restaurants, and you give personalized recommendations based on their taste.

Your tone is warm, concise, and enthusiastic about food — like a knowledgeable foodie friend. Keep replies short (2-4 sentences) unless the user asks for detail. Use emojis sparingly. Always answer in the user's language (default Spanish).

You can help with:
- Recommending restaurants that match the user's taste (cuisines, price, neighborhood, occasion)
- Explaining what a place is like
- Suggesting where to go for a specific craving, date, group, or budget
- Helping decide between options
- Tips on dishes to order

When recommending, reference real restaurants from the provided list when possible, and give a short reason for each pick. If none of the known restaurants fit, say so and suggest the kind of place to look for.`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const message = (body?.message || '').toString().slice(0, 1000);
    const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
    if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

    // Load user taste context
    const [logs, savedItems, restaurants] = await Promise.all([
      base44.entities.RestaurantLog.filter({ user_id: user.id }, '-visited_at', 10),
      base44.entities.ListItem.filter({ user_id: user.id }, '-created_date', 10),
      base44.entities.Restaurant.list('-average_rating', 30)
    ]);

    const restaurantById = (id) => restaurants.find(r => r.id === id);
    const recentLogs = logs.map(l => {
      const r = restaurantById(l.restaurant_id);
      return `- ${r?.name || 'Unknown'} (${r?.cuisines?.join('/') || '?'}, ${r?.price_level || '?'}, ${r?.neighborhood || '?'}): rated ${l.overall_rating}/5${l.review ? ` — "${l.review.slice(0, 80)}"` : ''}`;
    }).join('\n');

    const savedNames = savedItems.map(s => restaurantById(s.restaurant_id)?.name).filter(Boolean).join(', ');

    const tasteProfile = [
      user.favorite_cuisines?.length ? `Favorite cuisines: ${user.favorite_cuisines.join(', ')}` : '',
      user.disliked_cuisines?.length ? `Dislikes: ${user.disliked_cuisines.join(', ')}` : '',
      user.price_preferences?.length ? `Price range: ${user.price_preferences.join('-')}` : '',
      user.dietary_preferences?.length ? `Dietary: ${user.dietary_preferences.join(', ')}` : '',
      user.home_city ? `Home city: ${user.home_city}` : ''
    ].filter(Boolean).join('\n');

    const restaurantCatalog = restaurants.map(r =>
      `- ${r.name} | ${r.cuisines?.join('/')} | ${r.price_level} | ${r.neighborhood}, ${r.city} | ★${r.average_rating} | ${r.description || ''}`
    ).join('\n');

    const contextBlock = [
      'USER TASTE PROFILE:',
      tasteProfile || '(no preferences set yet — help them explore)',
      '',
      'USER RECENT RESTAURANT LOGS (visited & rated):',
      recentLogs || '(no visits logged yet)',
      '',
      'USER SAVED RESTAURANTS (want to try):',
      savedNames || '(none saved yet)',
      '',
      'AVAILABLE RESTAURANTS IN KOMIA:',
      restaurantCatalog
    ].join('\n');

    const messages = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n'),
      model: 'automatic'
    });

    const reply = typeof result === 'string' ? result : (result?.response || result?.text || JSON.stringify(result));

    return Response.json({ reply });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}