const { authenticateRequest, createClient, supabaseUrl, supabaseAnonKey } = require('./utils/auth.cjs');

exports.handler = async function(event, context) {
  const authResult = await authenticateRequest(event);

  if (authResult.error) {
    return {
      statusCode: authResult.statusCode,
      body: JSON.stringify({ error: authResult.error, details: authResult.details }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const { user, supabase_token } = authResult;

  // Create a Supabase client authenticated with the user's token for this request
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${supabase_token}` } },
  });

  const pathParts = event.path.split('/').filter(part => part);
  const deckId = pathParts.length === 3 && pathParts[1] === 'decks' ? pathParts[2] : null;

  // console.log(`[decks.js] Method: ${event.httpMethod}, Path: ${event.path}, Deck ID: ${deckId}, User: ${user.id}`);

  try {
    switch (event.httpMethod) {
      case 'GET':
        if (deckId) {
          // GET /api/decks/:id - Fetch a single deck
          // console.log(`--- [GET /api/decks/${deckId}] Request for user ${user.id} ---`);
          const { data: deck, error } = await supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .eq('user_id', user.id) // Ensure user owns the deck
            .single();

          if (error) throw error;
          if (!deck) return { statusCode: 404, body: JSON.stringify({ error: 'Deck not found or unauthorized' }) };
          return { statusCode: 200, body: JSON.stringify(deck), headers: { 'Content-Type': 'application/json' } };
        } else {
          // GET /api/decks - Fetch all decks for the user
          // console.log(`--- [GET /api/decks] Request for user ${user.id} ---`);
          const { data: decks, error } = await supabase
            .from('decks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          return { statusCode: 200, body: JSON.stringify(decks || []), headers: { 'Content-Type': 'application/json' } };
        }

      case 'POST':
        // POST /api/decks - Create a new deck
        // console.log(`--- [POST /api/decks] Request for user ${user.id} ---`);
        const { title, cards, description, tags, is_public, source_type, source_value, generation_params } = JSON.parse(event.body);
        const newDeckData = {
          user_id: user.id,
          title,
          cards: cards || [],
          description,
          tags: tags || [],
          is_public: is_public !== undefined ? is_public : false,
          source_type, 
          source_value,
          generation_params
        };
        const { data: createdDeck, error: createError } = await supabase
          .from('decks')
          .insert(newDeckData)
          .select()
          .single();
        
        if (createError) throw createError;
        return { statusCode: 201, body: JSON.stringify(createdDeck), headers: { 'Content-Type': 'application/json' } };

      case 'DELETE':
        if (!deckId) return { statusCode: 400, body: JSON.stringify({ error: 'Deck ID required for deletion' }) };
        // DELETE /api/decks/:id - Delete a deck
        // console.log(`--- [DELETE /api/decks/${deckId}] Request for user ${user.id} ---`);
        const { error: deleteError } = await supabase
          .from('decks')
          .delete()
          .eq('id', deckId)
          .eq('user_id', user.id); // Ensure user owns the deck

        if (deleteError) throw deleteError;
        return { statusCode: 204, body: '', headers: { 'Content-Type': 'application/json' } }; // No content

      default:
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }), headers: { 'Content-Type': 'application/json' } };
    }
  } catch (error) {
    console.error('[decks.js] Error:', error);
    // Consider more specific error codes based on Supabase errors (e.g., P2025 for not found)
    let statusCode = 500;
    if (error.code === 'PGRST116' || error.message.includes('not found')) statusCode = 404; // PGRST116: 0 rows from .single()
    if (error.status === 401 || (error.message && error.message.toLowerCase().includes('unauthorized'))) statusCode = 401;
    
    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
