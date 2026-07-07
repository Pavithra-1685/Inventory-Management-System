const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

counterSchema.statics.next = async function (name, session) {
  const counter = await this.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
