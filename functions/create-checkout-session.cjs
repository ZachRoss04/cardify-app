const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // We're expecting a POST request with a priceId
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
      headers: { 'Allow': 'POST' },
    };
  }

  try {
        const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        body: 'Missing userId in request body',
      };
    }

    const session = await stripe.checkout.sessions.create({
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1RajseG3nhBjcd9DvVQlH3FB', // Replace with your actual Price ID from your Stripe dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/cancel`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
