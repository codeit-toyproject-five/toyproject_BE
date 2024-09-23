import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    imageUrl:{
      type: String,
    },
    isPublic:{
      type: Boolean,
    },
    likeCount:{
      type: Number,
      default: 0,
    },
    badges:{
      type: [String],
      default: [],
    },
    postCount:{
      type: Number,
      default: 0,
    },
    createdAt:{
      type: Date,
      default: Date.now,
    },
    introduction:{
      type: String,
    }
  }
);

const Group = mongoose.model('Group', GroupSchema);

export default Group;
