import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Tables = ({ slug }) => {
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await api.get(`/tenant/${slug}/pos/tables/`);
        setTables(response.data);
      } catch (error) {
        console.error("Failed to fetch tables", error);
      }
    };
    fetchTables();
  }, [slug]);

  return (
    <div>
      <h3>Tables</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
        {tables.map(table => (
          <div
            key={table.id}
            onClick={() => navigate(`table/${table.id}`)}
            style={{
              border: '2px solid #ccc',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: table.status === 'occupied' ? '#ffcccc' : '#ccffcc',
              borderRadius: '8px'
            }}
          >
            <h4>Table {table.number}</h4>
            <p>{table.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tables;
