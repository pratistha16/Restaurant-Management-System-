import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const KitchenDisplay = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for now, eventually replace with API call
  useEffect(() => {
    // Simulate fetching active orders
    setTimeout(() => {
        setOrders([
            {
                id: 101,
                table: 'Table 4',
                waiter: 'John D.',
                time: '12:30 PM',
                status: 'pending',
                items: [
                    { name: 'Chicken Burger', qty: 2, notes: 'No onions' },
                    { name: 'Fries', qty: 1, notes: 'Extra crispy' },
                    { name: 'Coke', qty: 2 }
                ]
            },
            {
                id: 102,
                table: 'Table 7',
                waiter: 'Sarah M.',
                time: '12:32 PM',
                status: 'preparing',
                items: [
                    { name: 'Veg Pizza', qty: 1, notes: '' },
                    { name: 'Garlic Bread', qty: 1, notes: '' }
                ]
            },
             {
                id: 103,
                table: 'Takeaway #45',
                waiter: 'Counter',
                time: '12:35 PM',
                status: 'pending',
                items: [
                    { name: 'Pasta Alfredo', qty: 1, notes: 'Extra cheese' }
                ]
            }
        ]);
        setLoading(false);
    }, 1000);
  }, [slug]);

  const updateStatus = (orderId, newStatus) => {
      setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
      ));
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'pending': return 'bg-yellow-100 border-yellow-500';
          case 'preparing': return 'bg-blue-100 border-blue-500';
          case 'ready': return 'bg-green-100 border-green-500';
          default: return 'bg-gray-100 border-gray-500';
      }
  };

  return (
    <div className="min-h-screen bg-gray-800 p-4">
      <header className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg shadow-lg">
        <div>
             <h1 className="text-3xl font-bold text-white tracking-wider">KITCHEN DISPLAY SYSTEM</h1>
             <p className="text-gray-400 text-sm">Live Orders Stream</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-white px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition">
            &larr; Back to Dashboard
        </button>
      </header>

      {loading ? (
          <div className="text-white text-center text-2xl mt-20 animate-pulse">Loading orders...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.map(order => (
                  <div key={order.id} className={`rounded-lg shadow-lg border-t-8 p-4 flex flex-col h-full justify-between ${getStatusColor(order.status)}`}>
                      <div>
                        <div className="flex justify-between items-start mb-4 border-b border-gray-300/50 pb-2">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{order.table}</h2>
                                <p className="text-sm text-gray-600">#{order.id} • {order.waiter}</p>
                            </div>
                            <span className="text-lg font-mono font-bold text-gray-700">{order.time}</span>
                        </div>
                        
                        <ul className="space-y-3 mb-4">
                            {order.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-start">
                                    <span className="font-bold text-gray-800 text-lg">{item.qty}x</span>
                                    <div className="flex-1 ml-3">
                                        <span className="block text-gray-800 font-medium text-lg leading-tight">{item.name}</span>
                                        {item.notes && <span className="block text-red-600 text-sm italic">Note: {item.notes}</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-300/50">
                          {order.status === 'pending' && (
                              <button 
                                onClick={() => updateStatus(order.id, 'preparing')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded shadow text-lg uppercase tracking-wide transition"
                              >
                                  Start Cooking
                              </button>
                          )}
                          {order.status === 'preparing' && (
                              <button 
                                onClick={() => updateStatus(order.id, 'ready')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded shadow text-lg uppercase tracking-wide transition"
                              >
                                  Mark Ready
                              </button>
                          )}
                          {order.status === 'ready' && (
                              <div className="text-center bg-green-200 text-green-800 font-bold py-2 rounded uppercase tracking-wide border border-green-400">
                                  ✓ Ready to Serve
                              </div>
                          )}
                      </div>
                  </div>
              ))}
              
              {orders.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 text-xl py-20">
                      No active orders. Kitchen is clear!
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
