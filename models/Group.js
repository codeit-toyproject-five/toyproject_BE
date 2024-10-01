import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    imageUrl:{
      type: String,
      required: true,
    },
    isPublic:{
      type: Boolean,
      required: true,
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
      required:true,
    },
    badgeCount:{
      type: Number,
      default: 0,
    },
    password:{
      type:String,
      required: true,
    }
  }
);

const Group = mongoose.model('Group', GroupSchema);

export default Group;
