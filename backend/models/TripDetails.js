import mongoose from 'mongoose';

const tripDetailsSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  nights: { type: Number, required: true },
  days: { type: Number, required: true },
  qualification_amount: { type: Number, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('TripDetails', tripDetailsSchema);
