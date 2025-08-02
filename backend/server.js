// server.js
require('dotenv').config(); // For loading .env variables

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();

// --- Middleware ---
app.use(cors()); // Allow CORS from any origin (for dev)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded (form) bodies

// --- Static: Serve uploaded files (attachments) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Example: API Route Structure (keep ready for when you split out routes) ---
const apiBase = '/api';
// const authRoutes = require('./routes/auth');
// const ticketRoutes = require('./routes/tickets');
// const categoryRoutes = require('./routes/categories');
// const userRoutes = require('./routes/users');

// app.use(`${apiBase}/auth`, authRoutes);
// app.use(`${apiBase}/tickets`, ticketRoutes);
// app.use(`${apiBase}/categories`, categoryRoutes);
// app.use(`${apiBase}/users`, userRoutes);

// --- Test route for backend status ---
app.get('/', (req, res) => res.send('QuickDesk API is running!'));

// --- DB Connection Test Route (useful for troubleshooting your setup) ---
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Example for 404 handler (when route not found) ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// --- Example for error handler middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log error for debugging
  res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
