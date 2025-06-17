import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../context/AuthContext';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

const SubscribeButton = () => {
  const { user } = useAuth();
  const handleClick = async () => {
    try {
            if (!user) {
        console.error('User must be logged in to subscribe.');
        // Optionally, you could redirect to login or show a message
        return;
      }

      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const session = await response.json();

      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: session.sessionId });

        if (error) {
          console.error('Error redirecting to checkout:', error);
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <button onClick={handleClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Subscribe for $5/month
    </button>
  );
};

export default SubscribeButton;
