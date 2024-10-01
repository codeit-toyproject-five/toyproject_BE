import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    groupId:{
      type: Number,
    },
    nickname:{
      type: String,
      required: true,
    },
    title:{
      type: String,
      required: true,
    },
    postPassword:{
      type: String,
      required: true,
    },
    content:{
      type: String,
      required:true,
    },
    imageUrl:{
      type: String,
      required: true,
    },
    tags:{
      type:[String],
      required: true,
    },
    location:{
      type:String,
      required:true,
    },
    moment:{
      type: String,
      required: true,
    },
    isPublic:{
      type:Boolean,
      required: true,
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