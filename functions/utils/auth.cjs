const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL; // Use VITE_ prefix as it's set in Netlify UI
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing for function authentication. Check Netlify environment variables.');
  // Do not exit process here, let the function fail gracefully
}

// Initialize a global Supabase client for auth purposes if needed, though typically we use user's token
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to create a Supabase client with Service Role privileges
function createSupabaseServiceRoleClient() {
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_KEY is not set. This client will not have admin privileges.');
    // Fallback to anon key or handle error as appropriate for your security model
    // For now, we'll throw an error if it's critical for the operation
    throw new Error('SUPABASE_SERVICE_KEY is required for service role operations.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function authenticateRequest(event) {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: 'Authorization token required',
      statusCode: 401,
      user: null,
      supabase_token: null
    };
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
    
    if (getUserError) {
      console.log('Auth Error: Token validation failed', getUserError.message);
      return {
        error: 'Invalid token',
        details: getUserError.message,
        statusCode: 401,
        user: null,
        supabase_token: null
      };
    }
    if (!user) {
      console.log('Auth Error: No user found for token');
      return {
        error: 'User not found for token',
        statusCode: 401,
        user: null,
        supabase_token: null
      };
    }
    
    // console.log(`User ${user.id} authenticated successfully for function.`);
    return {
      user,
      supabase_token: token,
      statusCode: 200, // Indicates auth success, not final HTTP status
      error: null
    };
  } catch (err) {
    console.error('Auth Middleware-like Error in function:', err);
    return {
      error: 'Internal server error during authentication',
      statusCode: 500,
      user: null,
      supabase_token: null
    };
  }
}

module.exports = { authenticateRequest, createClient, supabaseUrl, supabaseAnonKey, createSupabaseServiceRoleClient, supabaseServiceKey };
