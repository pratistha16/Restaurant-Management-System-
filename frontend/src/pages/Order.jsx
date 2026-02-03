import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { CreditCard, DollarSign, Wallet, Check, X, Printer } from 'lucide-react';

const Order = ({ slug }) => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  
  // Menu State
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Order State
  const [existingOrder, setExistingOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch Menu and Existing Order
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, itemRes] = await Promise.all([
          api.get(`/tenant/${slug}/menu/categories/`),
          api.get(`/tenant/${slug}/menu/items/`)
        ]);
        setCategories(catRes.data);
        setItems(itemRes.data);
        if (catRes.data.length > 0) {
          setActiveCategory(catRes.data[0].id);
        }
        
        // Fetch existing active order for this table
        // We use the new filter capability: /orders/?table=ID&status=open,preparing,ready,served
        // Actually status filtering might need multiple values or custom filter.
        // Let's try fetching open orders first.
        const orderRes = await api.get(`/tenant/${slug}/pos/orders/?table=${tableId}&status=open`);
        // If no open order, check for others? Or just grab the first non-completed one.
        // Since we only allow one active session/order per table, the latest one should be it.
        // But let's refine: The backend creates a session.
        if (orderRes.data.results && orderRes.data.results.length > 0) {
            setExistingOrder(orderRes.data.results[0]);
        } else {
             // Try other statuses if 'open' isn't enough (e.g. 'served')
             // For now, let's assume 'open' covers active orders or we can filter on frontend if needed.
             // A better approach is to fetch all for table and pick the active one.
             const allOrders = await api.get(`/tenant/${slug}/pos/orders/?table=${tableId}`);
             const active = allOrders.data.results.find(o => !['completed', 'cancelled'].includes(o.status));
             if (active) {
                 setExistingOrder(active);
             }
        }

      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [slug, tableId]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.item === item.id);
      if (existing) {
        return prev.map(i => i.item === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { item: item.id, name: item.name, price: item.base_price, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.item !== itemId));
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        table: parseInt(tableId),
        items: cart.map(i => ({ item: i.item, qty: i.qty })),
        type: 'dine_in'
      };
      
      const res = await api.post(`/tenant/${slug}/pos/orders/`, payload);
      setExistingOrder(res.data); // Update existing order with new data
      setCart([]); // Clear cart
      alert("Order sent to kitchen!");
    } catch (error) {
      console.error("Order failed", error);
      alert("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = () => {
    if (!existingOrder) return;
    // Calculate total including cart if any? No, usually require submission first.
    if (cart.length > 0) {
        if(!window.confirm("You have unsent items in the cart. They will not be included in payment unless sent first. Continue?")) {
            return;
        }
    }
    setPaymentAmount(existingOrder.total_amount);
    setShowPaymentModal(true);
  };

  const handlePay = async () => {
    setProcessingPayment(true);
    try {
        const res = await api.post(`/tenant/${slug}/pos/orders/${existingOrder.id}/pay/`, {
            amount: paymentAmount,
            method: paymentMethod
        });
        
        if (res.data.status === 'paid' && res.data.order_status === 'completed') {
            alert("Payment successful! Order completed.");
            navigate(`/${slug}/pos`); // Back to tables
        } else {
            alert(`Payment recorded. Remaining: ${existingOrder.total_amount - res.data.paid_amount}`);
            // Refresh order
            const updatedOrder = await api.get(`/tenant/${slug}/pos/orders/${existingOrder.id}/`);
            setExistingOrder(updatedOrder.data);
            setShowPaymentModal(false);
        }
    } catch (error) {
        console.error("Payment failed", error);
        alert("Payment failed.");
    } finally {
        setProcessingPayment(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const orderTotal = existingOrder ? parseFloat(existingOrder.total_amount) : 0;
  const grandTotal = orderTotal + cartTotal;

  const filteredItems = items.filter(i => i.category === activeCategory);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
        {/* Categories */}
        <div className="p-4 border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex space-x-2">
            {categories.map(cat => (
                <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                >
                {cat.name}
                </button>
            ))}
            </div>
        </div>
        
        {/* Items Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
                <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center text-center h-full justify-between"
                >
                <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400">
                    {/* Placeholder for Image */}
                    <span className="text-2xl font-bold">{item.name.charAt(0)}</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
                <p className="text-blue-600 font-bold">${item.base_price}</p>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* Order Summary / Cart */}
      <div className="w-96 flex flex-col bg-gray-50 border-l border-gray-200 shadow-xl z-10">
        <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Table {tableId}</h3>
                <span className="text-sm text-gray-500">{new Date().toLocaleTimeString()}</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Existing Order Items */}
            {existingOrder && existingOrder.items && existingOrder.items.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Submitted Items</h4>
                    <div className="space-y-2">
                        {existingOrder.items.map((item, idx) => (
                            <div key={`existing-${idx}`} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 opacity-75">
                                <div className="flex items-center space-x-2">
                                    <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-xs font-bold">{item.quantity}</span>
                                    <span className="text-gray-700 text-sm">{item.item_name || "Item"}</span>
                                </div>
                                <span className="text-gray-600 text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-right border-t border-gray-200 pt-2">
                         <p className="text-sm text-gray-500">Subtotal: ${parseFloat(existingOrder.total_amount).toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* New Items (Cart) */}
            {cart.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">New Items</h4>
                    <div className="space-y-2">
                        {cart.map((item, idx) => (
                            <div key={`cart-${idx}`} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-blue-100">
                                <div className="flex items-center space-x-2">
                                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded text-xs font-bold">{item.qty}</span>
                                    <span className="text-gray-800 text-sm font-medium">{item.name}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-gray-800 text-sm font-bold">${(item.price * item.qty).toFixed(2)}</span>
                                    <button onClick={() => removeFromCart(item.item)} className="text-red-400 hover:text-red-600">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {cart.length === 0 && (!existingOrder || existingOrder.items.length === 0) && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <p>Order is empty</p>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 space-y-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={submitOrder} 
                    disabled={loading || cart.length === 0}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
                        cart.length === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    <span>Send to Kitchen</span>
                </button>
                
                <button 
                    onClick={openPaymentModal}
                    disabled={!existingOrder}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
                        !existingOrder 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    <DollarSign size={18} />
                    <span>Pay</span>
                </button>
            </div>
            <button onClick={() => navigate(`/${slug}/pos`)} className="w-full py-2 text-gray-500 text-sm hover:text-gray-800">
                Back to Tables
            </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Process Payment</h2>
                    <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Pay</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input 
                            type="number" 
                            value={paymentAmount} 
                            onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                        />
                    </div>
                </div>
                
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['cash', 'card', 'online'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                    paymentMethod === method 
                                    ? 'border-green-500 bg-green-50 text-green-700' 
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                            >
                                {method === 'cash' && <Wallet size={24} className="mb-1" />}
                                {method === 'card' && <CreditCard size={24} className="mb-1" />}
                                {method === 'online' && <DollarSign size={24} className="mb-1" />}
                                <span className="capitalize text-sm font-medium">{method}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <button 
                    onClick={handlePay}
                    disabled={processingPayment}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {processingPayment ? (
                        <span>Processing...</span>
                    ) : (
                        <>
                            <span>Confirm Payment</span>
                            <Check size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Order;
