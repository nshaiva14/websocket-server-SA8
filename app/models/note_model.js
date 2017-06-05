import mongoose, { Schema } from 'mongoose';

const PostSchema = new Schema({
  title: String,
  text: String,
  x: Number,
  y: Number,
}, {
  toJSON: {
    virtuals: true,
  },
});

const PostModel = mongoose.model('Post', PostSchema);


export default PostModel;
