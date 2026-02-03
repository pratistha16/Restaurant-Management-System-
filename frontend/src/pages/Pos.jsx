import React from 'react';
import { useParams, Routes, Route, useNavigate } from 'react-router-dom';
import Tables from './Tables';
import Order from './Order';

const Pos = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '10px', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
        <h2>POS - {slug}</h2>
        <button onClick={() => navigate(slug ? `/${slug}/dashboard` : '/dashboard')}>Switch Restaurant</button>
      </header>
      <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        <Routes>
          <Route path="/" element={<Tables slug={slug} />} />
          <Route path="/table/:tableId" element={<Order slug={slug} />} />
        </Routes>
      </div>
    </div>
  );
};

export default Pos;
