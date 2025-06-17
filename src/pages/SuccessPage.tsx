import { Link } from 'react-router-dom';

const SuccessPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full text-center p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Thank You!</h1>
        <p className="text-gray-700 mb-6">
          Your subscription has been successfully processed. Welcome aboard!
        </p>
        <p className="text-gray-600 text-sm mb-6">
          Your account has been upgraded. It may take a few moments for the changes to reflect.
        </p>
        <Link
          to="/dashboard"
          className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;
