const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const bookRoutes = require('./routes/books');
const apiRoutes = require('./routes/api');
const Book = require('./models/Book');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Determine the correct path to public directory
const publicDirectoryPath = path.join(__dirname, '../public');
console.log('Public directory path:', publicDirectoryPath);

// Serve static files from the 'public' directory
app.use(express.static(publicDirectoryPath));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/book_collection';


let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToMongoDB() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB');
        return mongoose;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Connect to MongoDB
connectToMongoDB();

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/external', apiRoutes);

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} in your browser`);
});

app.delete('/api/books', async (req, res) => {
  try {
    await Book.deleteMany({});
    res.json({ message: 'All books deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete books' });
  }
});
