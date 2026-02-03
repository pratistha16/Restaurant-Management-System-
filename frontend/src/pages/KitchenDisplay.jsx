import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { RefreshCw, CheckCircle, Clock, ChefHat } from 'lucide-react';

const KitchenDisplay = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchOrders = async () => {
    try {
        // Fetch active orders (open, confirmed, preparing, ready)
        // We'll fetch them in parallel to ensure we get all relevant statuses
        // Note: Ideally backend should support ?status__in=... or a custom 'active' filter
        const statuses = ['open', 'confirmed', 'preparing', 'ready'];
        const requests = statuses.map(status => 
            api.get(`/tenant/${slug}/pos/orders/?status=${status}`)
        );
        
        const responses = await Promise.all(requests);
        
        // Combine results and deduplicate just in case
        let allOrders = [];
        responses.forEach(res => {
            if (res.data.results) {
                allOrders = [...allOrders, ...res.data.results];
            }
        });
        
        // Sort by creation time (oldest first)
        allOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        setOrders(allOrders);
        setLastUpdated(new Date());
        setLoading(false);
    } catch (error) {
        console.error("Failed to fetch KDS orders", error);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [slug]);

  const updateStatus = async (orderId, newStatus) => {
      try {
          await api.post(`/tenant/${slug}/pos/orders/${orderId}/set_status/`, { status: newStatus });
          // Optimistic update
          setOrders(prev => prev.map(o => 
              o.id === orderId ? { ...o, status: newStatus } : o
          ));
          // Refetch to be sure
          fetchOrders();
      } catch (error) {
          console.error("Failed to update status", error);
          alert("Failed to update order status");
      }
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'open': 
          case 'confirmed': return 'bg-yellow-50 border-yellow-400';
          case 'preparing': return 'bg-blue-50 border-blue-400';
          case 'ready': return 'bg-green-50 border-green-400';
          default: return 'bg-gray-50 border-gray-300';
      }
  };

  const formatTime = (isoString) => {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 font-sans">
      <header className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
        <div className="flex items-center space-x-4">
             <ChefHat className="text-white w-8 h-8" />
             <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">KITCHEN DISPLAY SYSTEM</h1>
                <p className="text-gray-400 text-xs flex items-center gap-1">
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
             </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex space-x-2 text-sm text-gray-300 mr-4">
                <span className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></span> Pending</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1"></span> Preparing</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-green-400 rounded-full mr-1"></span> Ready</span>
            </div>
            <button onClick={() => navigate(`/${slug}/dashboard`)} className="text-gray-300 hover:text-white px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition">
                Exit KDS
            </button>
        </div>
      </header>

      {loading && orders.length === 0 ? (
          <div className="flex justify-center items-center h-64">
              <div className="text-white text-xl animate-pulse flex items-center gap-2">
                  <RefreshCw className="animate-spin" /> Loading orders...
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.map(order => (
                  <div key={order.id} className={`rounded-lg shadow-lg border-t-4 p-4 flex flex-col h-full justify-between transition-all duration-300 ${getStatusColor(order.status)}`}>
                      <div>
                        <div className="flex justify-between items-start mb-3 border-b border-gray-200/50 pb-2">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {order.table_number ? `Table ${order.table_number}` : `Order #${order.id}`}
                                </h2>
                                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                                    {order.order_type.replace('_', ' ')} • {order.waiter_name || 'Staff'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xl font-mono font-bold text-gray-800">{formatTime(order.created_at)}</span>
                                <span className="text-xs text-gray-500">
                                    {Math.floor((new Date() - new Date(order.created_at)) / 60000)} min ago
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 mb-4 overflow-y-auto max-h-60">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start border-b border-dashed border-gray-200 pb-2 last:border-0">
                                    <div className="flex items-start">
                                        <span className="font-bold text-gray-900 text-lg min-w-[30px]">{item.quantity}x</span>
                                        <div className="ml-2">
                                            <span className="block text-gray-800 font-semibold text-lg leading-tight">{item.item_name}</span>
                                            {item.notes && <span className="block text-red-600 text-sm font-medium bg-red-50 px-1 rounded mt-1">Note: {item.notes}</span>}
                                            {item.addons && item.addons.length > 0 && (
                                                <span className="text-gray-500 text-xs block">+ {item.addons.join(', ')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-200/50">
                          {(order.status === 'open' || order.status === 'confirmed') && (
                              <button 
                                onClick={() => updateStatus(order.id, 'preparing')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded shadow-md text-lg uppercase tracking-wide transition flex items-center justify-center gap-2"
                              >
                                  <ChefHat size={20} /> Start Cooking
                              </button>
                          )}
                          {order.status === 'preparing' && (
                              <button 
                                onClick={() => updateStatus(order.id, 'ready')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded shadow-md text-lg uppercase tracking-wide transition flex items-center justify-center gap-2"
                              >
                                  <CheckCircle size={20} /> Mark Ready
                              </button>
                          )}
                          {order.status === 'ready' && (
                              <div className="w-full bg-green-100 text-green-800 font-bold py-3 px-4 rounded border border-green-300 text-center uppercase tracking-wide flex items-center justify-center gap-2">
                                  <CheckCircle size={20} /> Ready to Serve
                              </div>
                          )}
                      </div>
                  </div>
              ))}
              
              {orders.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20">
                      <ChefHat size={64} className="mb-4 opacity-20" />
                      <p className="text-xl font-medium">No active orders</p>
                      <p className="text-sm">Kitchen is clear!</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
