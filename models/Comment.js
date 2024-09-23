import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    nickname:{
      type: String,
    },
    content:{
      type: String,
    },
    createdAt:{
      type: Date,
      default: Date.now(),
    }
  }
);

const Comment = mongoose.model('Comment',CommentSchema);

export default Comment;