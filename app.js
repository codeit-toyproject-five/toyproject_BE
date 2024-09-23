import express from 'express';
import mongoose from 'mongoose';
import {DATABASE_URL} from './env.js';
import Group from './models/Group.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';

const app = express();
app.use(express.json());

//그룹 등록(/api/groups, POST)
app.post('/api/groups',async(req,res)=>{
  const {name, imageUrl, isPublic, introduction} = req.body;
  
  const newGroup = new Group({
    name,
    imageUrl,
    isPublic,
    introduction
  });

  const savedGroup = await newGroup.save();

  res.status(201).json(savedGroup);
});

app.get('/api/groups',(req,res)=>{
  const page = req.query.page || 1;
  const pageSize = req.query.pageSize || 10;
  const sortBy = req.query.SortBy;
  const keyword = req.query.keyword;
  const isPublic = req.query.keyword;
});

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));
app.listen(3000, () => console.log('Server Started'));