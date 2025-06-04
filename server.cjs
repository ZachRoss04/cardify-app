console.log('--- SERVER.CJS IS LOADING NOW ---');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Supabase Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`--- INCOMING REQUEST: ${req.method} ${req.url} ---`);
  next(); // Pass control to the next middleware/route handler
});
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let generateDeckHandler;

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth Error: No token provided or malformed header');
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.log('Auth Error: Token validation failed', error.message);
      return res.status(401).json({ error: 'Invalid token', details: error.message });
    }
    if (!user) {
      console.log('Auth Error: No user found for token');
      return res.status(401).json({ error: 'User not found for token' });
    }
    req.user = user; // Attach user to request object
    req.supabase_token = token; // Store the token for request-scoped Supabase client
    console.log(`User ${user.id} authenticated successfully.`);
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};



// Dynamically import the ES Module
async function loadGenerateDeckHandler() {
  if (!generateDeckHandler) {
    const generateDeckModulePath = path.join(__dirname, 'functions', 'generate-deck.js');
    if (!fs.existsSync(generateDeckModulePath)) {
      console.error(`File not found: ${generateDeckModulePath}`);
      process.exit(1);
    }
    try {
      const module = await import(generateDeckModulePath);
      if (module.default) {
        generateDeckHandler = module.default; // Assuming the handler is the default export
        // console.log('generate-deck.js handler loaded successfully.'); // Kept original success log commented for brevity
      } else {
        console.error('ERROR: generate-deck.js does not have a default export.');
        process.exit(1);
      }
    } catch (err) {
      console.error('Failed to load generate-deck.js handler:', err);
      process.exit(1);
    }
  }
  return generateDeckHandler;
}

// API Routes
app.post('/api/generate-deck', authenticateUser, upload.single('file'), async (req, res) => {
  const handler = await loadGenerateDeckHandler();
  if (!handler) {
    return res.status(500).json({ error: 'Generate deck handler not loaded' });
  }

  let source_content;
  let source_type = req.body.source_type;
  let deck_title = req.body.deck_title;
  let options = req.body.options;

  if (req.file) {
    // If a file is uploaded, use its content (converted to base64)
    source_content = req.file.buffer.toString('base64');
    // source_type, deck_title, and options should be in req.body from FormData
  } else {
    // If no file, expect source_content in the JSON body
    source_content = req.body.source_content;
  }

  // Ensure options is an object if it's a string (from FormData)
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (e) {
      console.error('Error parsing options from FormData:', e);
      return res.status(400).json({ error: 'Invalid options format' });
    }
  }

  // Construct a new request-like object for the handler
  const handlerReq = {
    method: 'POST', // Mimic the method
    body: {
      source_type,
      source_content,
      deck_title,
      options: options || {}
    }
  };

  // Call the imported handler by capturing its response
  let capturedStatus = 200;
  let capturedData = null;
  const captureRes = {
    status: function(statusCode) {
      capturedStatus = statusCode;
      return this; // for chaining
    },
    json: function(data) {
      capturedData = data;
    }
  };

  try {
    await handler(handlerReq, captureRes);

    if (capturedData && capturedStatus >= 200 && capturedStatus < 300) {
      try {
        if (!req.user || !req.user.id) {
          console.error('[CRITICAL] /api/generate-deck: User ID not found in req.user. This should not happen if authenticateUser middleware is correct.');
          if (!res.headersSent) {
            res.status(401).json({ error: 'User authentication failed or user ID missing.' });
          }
          return;
        }
        const userIdForDeck = req.user.id;
        console.log(`[DEBUG] /api/generate-deck: Attempting to insert deck for user_id: ${userIdForDeck}`);
        console.log(`[DEBUG] /api/generate-deck: Deck data to be passed to RPC: title='${capturedData.deck_title || req.body.deck_title || 'Untitled Deck'}', card_count=${capturedData.cards ? capturedData.cards.length : 0}`);

        const rpcParams = {
          p_user_id: userIdForDeck,
          deck_title: deck_title,
          deck_cards: capturedData.cards,
          p_description: null, // Default value for description
          p_tags: null,        // Default value for tags (or '[]'::jsonb)
          p_is_public: false   // Default value for is_public
        };
        console.log('[DEBUG] /api/generate-deck: Calling insert_user_deck with params:', JSON.stringify(rpcParams));
        
        const { data: rpcResponseData, error: insertError } = await supabase
          .rpc('insert_user_deck', rpcParams);

        console.log('[DEBUG] /api/generate-deck: Response from insert_user_deck RPC: data=', JSON.stringify(rpcResponseData), 'error=', JSON.stringify(insertError));

        let finalDeckData = null;
        // The RPC function `insert_user_deck` should return a single record or an array with a single record if defined with `RETURNS SETOF decks`.
        if (rpcResponseData) {
          if (Array.isArray(rpcResponseData) && rpcResponseData.length > 0) {
            finalDeckData = rpcResponseData[0];
          } else if (typeof rpcResponseData === 'object' && !Array.isArray(rpcResponseData)) {
            finalDeckData = rpcResponseData;
          }
        }

        if (insertError) {
          console.error('Supabase RPC call insert_user_deck returned an error:', insertError);
          if (!res.headersSent) {
            res.status(500).json({
              message: 'Failed to save deck to database via RPC.', 
              error: insertError 
            });
          }
          return;
        }

        if (!finalDeckData) {
          console.error('Supabase RPC call insert_user_deck did not return the expected deck data. Response was:', rpcResponseData);
          if (!res.headersSent) {
            res.status(500).json({
              message: 'Failed to save deck to database via RPC or no data returned.',
              details: 'The database operation did not return the created deck information.'
            });
          }
          return;
        }
        
        // Log the critical fields from the returned deck data
        console.log(`[DEBUG] /api/generate-deck: RPC returned deck with id: ${finalDeckData.id}, user_id: ${finalDeckData.user_id}, title: ${finalDeckData.title}`);

        if (!finalDeckData.id || !finalDeckData.user_id) {
            console.error('[CRITICAL] /api/generate-deck: Deck data from RPC is missing id or user_id. Data:', JSON.stringify(finalDeckData));
            // Still send back what we have, but log critical error
        }

        console.log(`Deck ${finalDeckData.id} created for user ${userIdForDeck}. RPC returned user_id: ${finalDeckData.user_id}`);
        if (!res.headersSent) {
          res.status(capturedStatus).json(finalDeckData);
        }

      } catch (dbError) {
        console.error(`Database operation error in /api/generate-deck: ${dbError}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error during deck saving' });
        }
      }
    } else if (!res.headersSent) {
      res.status(capturedStatus || 500).json(capturedData || { error: 'Failed to generate deck or handler error' });
    }
  } catch (error) {
    console.error(`Error in /api/generate-deck route: ${error}`);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error during deck generation' });
    }
  }
});

// Deck Management API
app.get('/api/decks', authenticateUser, async (req, res) => {
  const { user, supabase_token } = req;
  if (!user || !user.id || !supabase_token) {
    console.error('--- [GET /api/decks] Error: User/token not found on request object or user.id is missing ---');
    return res.status(401).json({ error: 'User not authenticated, token missing, or user ID missing.' });
  }

  const userId = user.id;
  console.log(`--- [GET /api/decks] Request received for user ${userId} ---`);

  try {
    // Create a new Supabase client for this request, authenticated with the user's token
    const supabaseAuthedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${supabase_token}` } },
    });

    const { data, error } = await supabaseAuthedClient
      .from('decks')
      .select('*'); // RLS will handle filtering by user_id due to the token

    console.log(`--- [GET /api/decks] Supabase response for user ${userId}: error =`, error, `data (length) = ${data ? data.length : 'null/undefined'}`);
    // console.log(`--- [GET /api/decks] Supabase response data for user ${userId}:`, JSON.stringify(data)); // Uncomment for full data if needed, can be verbose

    if (error) {
      console.error(`--- [GET /api/decks] Error fetching decks from Supabase for user ${userId}:`, dbError);
      return res.status(500).json({ error: dbError.message });
    }

    console.log(`--- [GET /api/decks] Successfully fetched ${data ? data.length : 0} decks for user ${userId}. Sending response.`);
    res.json(data || []); // Ensure sending an array even if data is null or undefined
  } catch (err) {
    console.error(`--- [GET /api/decks] Unexpected error in route handler for user ${userId}:`, err);
    res.status(500).json({ error: 'Internal server error while fetching decks' });
  }
});

app.post('/api/decks', authenticateUser, async (req, res) => {
  console.log(`--- /API/DECKS POST ROUTE WAS HIT BY USER ${req.user.id} ---`);
  try {
    const { title, cards, description, tags, is_public } = req.body;

    if (!title || !cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Invalid request body: title and cards array are required.' });
    }

    const { data: newDeck, error } = await supabase
      .from('decks')
      .insert({
        user_id: req.user.id,
        title: title,
        cards: cards,
        card_count: cards.length,
        description: description,
        tags: tags,
        is_public: is_public === undefined ? false : is_public,
        // created_at and updated_at will be set by Supabase
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error in POST /api/decks:', error);
      return res.status(500).json({ error: 'Failed to create deck', details: error.message });
    }

    console.log(`POST /api/decks - Created deck ${newDeck.id} for user ${req.user.id} with ${cards.length} cards.`);
    res.status(201).json(finalDeckData);

  } catch (err) {
    console.error('Error in POST /api/decks:', err);
    res.status(500).json({ error: 'Internal server error while creating deck.' });
  }
});

app.delete('/api/decks/:id', authenticateUser, async (req, res) => {
  const deckId = req.params.id;
  console.log(`--- DELETE /api/decks/${deckId} REQUEST RECEIVED FROM USER ${req.user.id} ---`);
  const { supabase_token } = req;
  if (!supabase_token) {
    console.error('--- [DELETE /api/decks/:id] Error: Supabase token missing ---');
    return res.status(401).json({ error: 'Authorization token missing for Supabase client.' });
  }

  try {
    const supabaseAuthedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${supabase_token}` } },
    });

    // First, verify the deck belongs to the user (RLS will enforce this, but an explicit check is good practice)
    const { data: deck, error: fetchError } = await supabaseAuthedClient
      .from('decks')
      .select('id, user_id') // user_id is technically redundant due to RLS but good for explicit check
      .eq('id', deckId)
      // .eq('user_id', req.user.id) // This is now implicitly handled by RLS due to token
      .single();

    if (fetchError || !deck) {
      console.error('Supabase fetch error or deck not found/not user\'s in DELETE /api/decks/:id:', fetchError);
      return res.status(404).json({ error: 'Deck not found or you do not have permission to delete it.' });
    }

    // If deck exists and belongs to user, proceed with deletion
    // Re-use the supabaseAuthedClient defined at the start of the try block
    const { error: deleteError } = await supabaseAuthedClient
      .from('decks')
      .delete()
      .eq('id', deckId); // RLS will ensure only the owner can delete

    if (deleteError) {
      console.error('Supabase delete error in DELETE /api/decks/:id:', deleteError);
      return res.status(500).json({ error: 'Failed to delete deck', details: deleteError.message });
    }

    res.status(200).json({ message: 'Deck deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/decks/:id:', err);
    res.status(500).json({ error: 'Internal server error while deleting deck.' });
  }
});

app.get('/api/decks/:id', authenticateUser, async (req, res) => {
  const deckId = req.params.id;
  console.log(`--- GET /api/decks/${deckId} REQUEST RECEIVED FROM USER ${req.user.id} ---`);
  const { supabase_token } = req;
  if (!supabase_token) {
    console.error('--- [GET /api/decks/:id] Error: Supabase token missing ---');
    return res.status(401).json({ error: 'Authorization token missing for Supabase client.' });
  }

  try {
    const supabaseAuthedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${supabase_token}` } },
    });

    const { data: deck, error } = await supabaseAuthedClient
      .from('decks')
      .select('*') // Select all columns for a single deck view
      .eq('id', deckId)
      .eq('user_id', req.user.id) // Explicitly check user_id along with RLS
      .single();

    if (error || !deck) {
      console.error(`--- [GET /api/decks/:id] Supabase error object for deck ${deckId}, user ${req.user.id}:`, JSON.stringify(error, null, 2));
      console.error(`--- [GET /api/decks/:id] Deck data (if any) for deck ${deckId}, user ${req.user.id}:`, JSON.stringify(deck, null, 2));

      if (error && (error.status === 401 || (error.message && error.message.toLowerCase().includes('unauthorized')))) {
        console.log(`--- [GET /api/decks/:id] Responding with 401 (Unauthorized) for deck ${deckId}, user ${req.user.id}`);
        return res.status(401).json({ error: 'Unauthorized to view this deck.' });
      }
      // If .single() returns null for data and no error, it means record not found or RLS filtered it.
      // If there's an error object, it might also indicate 'not found' (e.g., status 404 or specific message like 'PGRST116' for Supabase PostgREST)
      if ((!deck && !error) || (error && (error.status === 404 || (error.code === 'PGRST116' && error.message.includes('not found'))))) { // PGRST116 means 0 rows from .single()
        console.log(`--- [GET /api/decks/:id] Responding with 404 (Not Found or No Permission) for deck ${deckId}, user ${req.user.id}`);
        return res.status(404).json({ error: 'Deck not found or you do not have permission to view it.' });
      }
      
      // Catch-all for other Supabase errors during select single
      console.error(`--- [GET /api/decks/:id] Generic Supabase error for deck ${deckId}, user ${req.user.id}. Sending 500.`);
      return res.status(500).json({ error: 'Failed to fetch deck details due to a server error.' });
    }
    res.json(deck);
  } catch (err) {
    console.error('Error in GET /api/decks/:id:', err);
    res.status(500).json({ error: 'Internal server error while fetching deck.' });
  }
});

// Serve static files from the Vite build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Catch-all for any other requests (for debugging)
app.use((req, res) => {
  console.log(`--- CATCH-ALL: Request for ${req.method} ${req.url} was not handled by other routes ---`);
  res.status(404).send(`Cannot ${req.method} ${req.url} - No matching route found in server.cjs`);
});

// Start server after loading the handler
loadGenerateDeckHandler().then(() => {
  const serverInstance = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log('  POST /api/generate-deck');
    console.log('  GET  /api/decks');
    console.log('  GET  /api/decks/:id');
    console.log('  DELETE /api/decks/:id');
  });

  serverInstance.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`ERROR: Port ${PORT} is already in use. Please ensure no other instance is running.`);
    } else {
      console.error('Failed to start server due to an unexpected error:', err);
    }
    process.exit(1);
  });

}).catch(err => {
  console.error('Failed to load handler and start server:', err);
  process.exit(1);
});
