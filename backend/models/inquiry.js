// Define Inquiry Schema
const inquirySchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  message: String,
  submittedAt: { type: Date, default: Date.now }
});

// Define Inquiry Model
const Inquiry = mongoose.model('Inquiry', inquirySchema, 'inquiries');
