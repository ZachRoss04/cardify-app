const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Get this from your Stripe dashboard webhook settings

exports.handler = async ({ body, headers }) => {
  const sig = headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

    // Initialize Supabase Admin Client
  // This uses the Service Role Key for admin-level access
  const supabase = createClient(
    process.env.SUPABASE_URL, // Use non-VITE prefixed for server-side
    process.env.SUPABASE_SERVICE_KEY
  );

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;
      const stripeSubscriptionId = session.subscription;

      if (!userId) {
        console.error('Webhook Error: Missing client_reference_id (userId) on session.');
        break;
      }

      console.log(`Updating profile for user ${userId} with customer ID ${stripeCustomerId}.`);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          subscription_status: 'active',
        })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error:', JSON.stringify(error, null, 2));
      } else {
        console.log(`Successfully updated profile for user: ${userId}`);
      }

      break;
    }
    case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;

        if (!stripeCustomerId) {
            console.error('Webhook Error: Missing customer ID on subscription object.');
            break;
        }

        console.log(`Deactivating subscription for customer: ${stripeCustomerId}`);
        const { error: cancelError } = await supabase
            .from('user_profiles')
            .update({ subscription_status: 'inactive' })
            .eq('stripe_customer_id', stripeCustomerId);
        
        if (cancelError) {
            console.error('Supabase update error on cancellation:', cancelError);
        }

        break;
    }
    case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription was updated.', subscription);
        // TODO: Implement your logic to update the user's subscription status in your database
        break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
