import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize IndexedDB on app start
import { db } from '@/services/database';

// Check if database is accessible
db.open().catch((err) => {
  console.error('Failed to open database:', err);
  alert('Database initialization failed. Please check browser compatibility.');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
