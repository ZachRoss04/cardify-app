import { Link } from 'react-router-dom';

const CancelPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full text-center p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
        <p className="text-gray-700 mb-6">
          You have cancelled the checkout process. No payment was taken.
        </p>
        <Link
          to="/dashboard"
          className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default CancelPage;
