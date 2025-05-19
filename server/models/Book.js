const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  coverUrl: {
    type: String,
    default: 'default-cover.jpg' 
  },
 
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot be more than 100 characters']
  },
  year: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Year must be at least 1000'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true // Can't be modified after creation
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
bookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add virtual for formatted date (can be used in the frontend if needed)
bookSchema.virtual('formattedDate').get(function() {
  return new Date(this.createdAt).toLocaleDateString();
});

// Add method to get book age in years
bookSchema.methods.getAge = function() {
  const currentYear = new Date().getFullYear();
  return currentYear - this.year;
};

module.exports = mongoose.model('Book', bookSchema);