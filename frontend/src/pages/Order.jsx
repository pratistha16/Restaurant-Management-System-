import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const Order = ({ slug }) => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Menu
  useEffect(() => {
    const fetchMenu = async () => {
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
      } catch (error) {
        console.error("Failed to fetch menu", error);
      }
    };
    fetchMenu();
  }, [slug]);

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
        type: 'dine_in' // Default
      };
      await api.post(`/tenant/${slug}/pos/orders/`, payload);
      alert("Order placed successfully!");
      setCart([]);
      navigate(`/pos/${slug}`); // Go back to tables
    } catch (error) {
      console.error("Order failed", error);
      alert("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const filteredItems = items.filter(i => i.category === activeCategory);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Menu Section */}
      <div style={{ flex: 2, borderRight: '1px solid #ccc', padding: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '10px',
                background: activeCategory === cat.id ? '#007bff' : '#eee',
                color: activeCategory === cat.id ? '#fff' : '#000',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => addToCart(item)}
              style={{
                border: '1px solid #ddd',
                padding: '10px',
                borderRadius: '5px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <h4>{item.name}</h4>
              <p>${item.base_price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column' }}>
        <h3>Current Order (Table {tableId})</h3>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.map(item => (
            <div key={item.item} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
              <div>
                <div>{item.name}</div>
                <small>${item.price} x {item.qty}</small>
              </div>
              <button onClick={() => removeFromCart(item.item)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>X</button>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '2px solid #000', paddingTop: '10px', marginTop: '10px' }}>
          <h3>Total: ${total.toFixed(2)}</h3>
          <button 
            onClick={submitOrder} 
            disabled={loading || cart.length === 0}
            style={{ 
              width: '100%', 
              padding: '15px', 
              background: '#28a745', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '5px', 
              fontSize: '16px',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.5 : 1
            }}
          >
            {loading ? 'Processing...' : 'Place Order & Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Order;
