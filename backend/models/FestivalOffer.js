import mongoose from 'mongoose';

const packagePriceSchema = new mongoose.Schema({
  slug: String,
  name: String,
  amount: Number,
  direct: Number,
  passive: Number,
});

const festivalOfferSchema = new mongoose.Schema({
  active: { type: Boolean, default: false },
  marqueeText: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  bannerUrl: { type: String, default: '' },
  bannerPublicId: { type: String, default: '' },
  packages: [packagePriceSchema],
}, { timestamps: true });

export default mongoose.model('FestivalOffer', festivalOfferSchema);
