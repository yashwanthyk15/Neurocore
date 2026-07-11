const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'] },
  password: { type: String, required: true, minlength: 6 },
  grade: { type: String, default: '' },
  readingProfile: {
    fontSize: { type: Number, default: 18 },
    lineSpacing: { type: Number, default: 1.8 },
    chunkSize: { type: Number, default: 600 },
    useDyslexicFont: { type: Boolean, default: true },
    colorOverlay: { type: String, default: 'none' },
    theme: { type: String, default: 'light' },
    highContrast: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
