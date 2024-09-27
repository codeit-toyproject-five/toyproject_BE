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
  //req를 변수에 연결
  const {name, password ,imageUrl, isPublic, introduction} = req.body;
  
  //새로운 Group 객체 생성 후 데이터 삽입
  const newGroup = new Group({
    name,
    password,
    imageUrl,
    isPublic,
    introduction,
  });
  
  //DB에 데이터 저장
  const savedGroup = await newGroup.save();

  //status 및 res 전송
  res.status(201).json({
    id: savedGroup._id,
    name: savedGroup.name,
    imageUrl: savedGroup.imageUrl,
    isPublic: savedGroup.isPublic,
    likeCount: savedGroup.likeCount,
    badges: savedGroup.badges,
    postCount: savedGroup.postCount,
    createdAt: savedGroup.createdAt,
    introduction: savedGroup.introduction
  });
});


//그룹 조회(/api/groups, GET)
app.get('/api/groups',async (req,res)=>{
  //req 쿼리를 변수에 매칭.
  const page = Number(req.query.page);
  const pageSize = Number(req.query.pageSize);
  const sortBy = req.query.sortBy;
  const keyword = req.query.keyword;
  const isPublic = req.query.isPublic;

  //결과를 필터링
  const filter = {};

  //DB의 group에서 키워드를 검색
  if(keyword){
    filter.name = {$regex: keyword, $options: 'i'};
  }

  //isPublic 필터링
  if(isPublic !== undefined){
    filter.isPublic = isPublic ==='true'? true:false;
  }
  
  //페이지 계산
  const skip = (page-1) * pageSize;

  let sortOption;
  switch(sortBy){
    case 'mostPosted':
      sortOption = {postCount: -1};
      break;
    case 'mostLiked':
      sortOption = {likeCount: -1};
      break;
    case 'mostBadge':
      sortOption = {badgeCount: -1};
      break;
    case 'lastest':
    default:
      sortOption = {createdAt: -1};
      break;
  }

  //DB에 쿼리 날리기
  const groups = await Group.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(pageSize);

  const totalItemCount = await Group.countDocuments(filter);
  const totalPages = Math.ceil(totalItemCount/pageSize);

  res.status(200).json({
    currentPage: page,
    totalPages: totalPages,
    totalItemCount: totalItemCount,
    data: groups.map(group => ({
      id: group._id,
      name: group.name,
      imageUrl: group.imageUrl,
      isPublic: group.isPublic,
      likeCount: group.likeCount,
      badgeCount: group.badgeCount,
      postCount: group.postCount,
      createdAt: group.createdAt,
      introduction: group.introduction
    })),
  })
});

//그룹 정보 수정
app.patch('/api/groups/:groupId',async (req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  if(!group){
    res.status(404).send({message: 'id없음'});
  }
  if(group.password === req.body.password){
    group.name = req.body.name || group.name;
    group.imageUrl = req.body.imageUrl || group.imageUrl;
    group.isPublic = Boolean(req.body.isPublic) || group.isPublic;
    group.introduction = req.body.introduction || group.introduction;
    await group.save();
    res.status(200).json({
      id: group._id,
      name: group.name,
      imageUrl: group.imageUrl,
      isPublic: group.isPublic,
      likeCount: group.likeCount,
      badges: group.badges,
      postCount: group.postCount,
      createdAt: group.createdAt,
      introduction: group.introduction
    });
  } else{
    res.status(403).send({message: "비번오류"});
  }
});

//그릅 삭제
app.delete('/api/groups/:groupId',async (req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findByIdAndDelete(groupId);
});

//그룹 상세 정보 조회
app.get('/api/groups/:groupId',(req,res)=>{
  const groupId = req.params.groupId;
  
});

//그룹 조회 권한 확인
app.post('/api/groups/:groupId/verify-password',(req,res)=>{

});

//그룹 공감하기
app.post('/api/groups/:groupId/like',(req,res)=>{

});

//그룹 공개 여부 확인
app.get('api/groups/:groupId/is-public',(req,res)=>{

});

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));
app.listen(3000, () => console.log('Server Started'));