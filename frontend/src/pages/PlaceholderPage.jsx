import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PlaceholderPage = ({ title }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-gray-600 mb-8">This feature is currently under development.</p>
      <div className="space-x-4">
        <button 
          onClick={() => navigate(`/dashboard`)}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
        {slug && (
             <button 
             onClick={() => navigate(`/pos/${slug}`)}
             className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
           >
             Go to POS
           </button>
        )}
      </div>
    </div>
  );
};

export default PlaceholderPage;
