import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    groupId:{
      type: Number,
    },
    nickname:{
      type: String,
    },
    title:{
      type: String,
    },
    content:{
      type: String,
    },
    imageUrl:{
      type: String,
    },
    tags:{
      type:[String],
    },
    location:{
      type:String,
    },
    moment:{
      type: String,
    },
    isPublic:{
      type:Boolean,
    },
    likeCount:{
      type:Number,
      default:0
    },
    commentCount:{
      type: Number,
      default:0,
    },
    createdAt:{
      type:Date,
      default: Date.now(),
    }
  }
);

const Post = mongoose.model('Post',PostSchema);

export default Post;