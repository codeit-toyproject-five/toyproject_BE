import express from 'express';
import mongoose from 'mongoose';
import {DATABASE_URL} from './env.js';
import Group from './models/Group.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();
app.use(express.json());

function asyncHandler(handler){
  return async function (req,res){
    try{
      await handler(req,res);
    }catch(e){
      if(e.name === 'CastError'){
        res.status(404).send({message: "존재하지 않습니다"});
      } else{
        res.status(400).send({message: "잘못된 요청입니다"});
      }
    }
  }
}

// Swagger 설정
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Group API',
      version: '1.0.0',
      description: 'API documentation for Group management',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./app.js'], // 여기에 경로를 맞춰 Swagger 주석이 있는 파일을 지정
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Register a new group
 *     description: Creates a new group with the provided details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the group
 *                 example: Developer Group
 *               password:
 *                 type: string
 *                 description: The password for the group
 *                 example: securepassword
 *               imageUrl:
 *                 type: string
 *                 description: URL for the group's image
 *                 example: http://example.com/image.jpg
 *               isPublic:
 *                 type: boolean
 *                 description: Is the group public or private
 *                 example: true
 *               introduction:
 *                 type: string
 *                 description: A brief introduction of the group
 *                 example: This is a group for developers
 *     responses:
 *       201:
 *         description: Group successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created group
 *                 name:
 *                   type: string
 *                   description: The name of the group
 *                 imageUrl:
 *                   type: string
 *                   description: URL for the group's image
 *                 isPublic:
 *                   type: boolean
 *                   description: Is the group public or private
 *                 introduction:
 *                   type: string
 *                   description: A brief introduction of the group
 *       400:
 *         description: Invalid request
 */

//그룹 등록(/api/groups, POST)
app.post('/api/groups',asyncHandler(async(req,res)=>{
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
}));


//그룹 조회(/api/groups, GET)
app.get('/api/groups',asyncHandler(async (req,res)=>{
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
}));

//그룹 정보 수정
app.patch('/api/groups/:groupId',asyncHandler(async (req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);

  if(group.password === req.body.password){
    group.name = req.body.name;
    group.imageUrl = req.body.imageUrl;
    group.isPublic = Boolean(req.body.isPublic);
    group.introduction = req.body.introduction;
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
    return res.status(403).send({message: "비밀번호가 틀렸습니다"});
  }
}));

//그릅 삭제
app.delete('/api/groups/:groupId',asyncHandler(async (req,res)=>{
  const password = req.body.password;
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  if(password === undefined){
    return res.status(400).send({message: "잘못된 요청입니다"});
  }
  if(password !== group.password){
    return res.status(403).send({message: "비밀번호가 틀렸습니다"});
  }
}));

//그룹 상세 정보 조회
app.get('/api/groups/:groupId',async (req,res)=>{
  const groupId = req.params.groupId;
  try{
    const group = await Group.findById(groupId);

    res.status(200).json({
      id: group._id,
      name: group.name,
      imageUrl: group.imageUrl,
      isPublic: group.isPublic,
      badges: group.badges,
      postCount: group.postCount,
      createdAt: group.createdAt,
      introduction: group.introduction
    });
  } catch(e){
    res.status(400).send({message: "잘못된 요청입니다"})
  }
});

//그룹 조회 권한 확인
app.post('/api/groups/:groupId/verify-password',asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const password = req.body.password;
  const group = await Group.findById(groupId);
  if(password === group.password){
    return res.status(200).send({message:"비밀번호가 확인되었습니다"});
  } else{
    return res.status(401).send({message:"비밀번호가 틀렸습니다"})
  }
}));

//그룹 공감하기
app.post('/api/groups/:groupId/like',asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  group.likeCount++;
  if(group.likeCount>=10000){
    group.badges.push("그룹 공간 1만 개 이상 받기");
  }
  await group.save();
  res.status(200).send({message: "그룹 공감하기 성공"});
}));

//그룹 공개 여부 확인
app.get('api/groups/:groupId/is-public',asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  res.status(200).json({
    id: group._id,
    isPublic: group.isPublic,
  });
}));

//게시글 등록
app.post('api/groups/:groupId/posts', asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const req_body=req.body;
  const post = new Post({
    groupId: groupId,
    ...req_body,
    likeCount:0,
    commentCount: 0,
    createdAt: Date.now(),
  });
  const savedPost = await post.save();
  res.status(200).send(savedPost);
}));

//게시글 조회
app.get('api/groups/:groupId/posts', asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const sortBy = req.query.sortBy;
  const keyword = req.query.keyword;
  const isPublic = req.query.isPublic;

  const filter = {};

  //filter
  if(groupId){
    filter.groupId = groupId;
  }
  if(keyword){
    filter.title = { $regex: keyword, $options: 'i'};
  }
  if(isPublic!==undefined){
    filter.isPublic = isPublic === 'true'? true: false;
  }

  //paging
  const skip = (page-1) * pageSize;

  let sortOption;
  switch (sortBy) {
    case 'lastest':
    default:
      sortOption = { createdAt: -1};
      break;
    case 'mostCommented':
      sortOption = { commentCount: -1};
      break;
    case 'mostLiked':
      sortOption = { likeCount: -1};
      break;
  }
  const posts = await Post.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(pageSize);
  
    const totlaPostCount = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totlaPostCount/pageSize);

  res.status(200).json({
    currentPage: page,
    totalPages: totalPages,
    totalItemCount: totlaPostCount,
    data: posts.map(post=>({
      id: post._id,
      nickname: post.nickname,
      title: post.title,
      imageUrl: post.imageUrl,
      tags: post.tags,
      location: post.location,
      moment: post.moment,
      isPublic: post.isPublic,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt
    }))
  })
}));

//게시글 수정
app.patch('api/posts/:postId',asyncHandler(async(req,res)=>{
  const req_body = req.body;
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  const postPassword = req_body.postPassword;

  if(post.password !== postPassword){
    return res.status(403).send({message:"비밀번호가 틀렸습니다"});
  }
  post.nickname = req_body.nickname;
  post.title = req_body.title;
  post.content = req_body.content;
  post.imageUrl = req_body.imageUrl;
  post.tags = req_body.tags;
  post.location = req_body.location;
  post.moment = req_body.mement;
  post.isPublic = req_body.isPublic;

  const newpost = await post.save();

  res.status(200).json({
    id: newpost._id,
    groupId: newpost.groupId,
    nickname: newpost.nickname,
    title: newpost.title,
    content: newpost.content,
    imageUrl: newpost.imageUrl,
    tags: newpost.tags,
    location: newpost.location,
    moment: newpost.moment,
    isPublic: newpost.isPublic,
    likeCount: newpost.likeCount,
    commentCount: newpost.commentCount,
    createdAt: newpost.createdAt
  })
}));

//게시글 삭제
app.delete('api/posts/:postId',asyncHandler(async(req,res)=>{
  const postId = req.params.postId;
  const postPassword = req.body.postPassword;

  const post = await Post.findById(postId);

  if(post.postPassword !== postPassword){
    return res.status(403).send({message: "비밀번호가 틀렸습니다"});
  }
  await Post.findByIdAndDelete(postId);
  res.status(200).send({message: "게시글 삭제 성공"});
}));

//게시글 상세 정보 조회
app.get('api/posts/:postId',asyncHandler(async(req,res)=>{
  const postId = req.params.postId;
  const post = await Post.findById(postId);

  res.status(200).json({
    id: post._id,
    groupId: post.groupId,
    nickname: post.nickname,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    tags: post.tags,
    location: post.location,
    moment: post.moment,
    isPublic: post.isPublic,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt
  });
}));

//게시글 조회 권한 확인
app.post('api/posts/:postId/verify-password',async(req,res)=>{
  const postId = req.params.postId;
  const postPassword = req.body.password;

  const post = await Post.findById(postId);

  if(post.postPassword!==postPassword){
    return res.status(401).send({message: "비밀번호가 틀렸습니다"});
  }
  if(post.postPassword === postPassword){
    res.status(200).send({message:"비밀번호가 확인되었습니다"});
  }
});


//게시글 공감하기
app.post('api/posts/:postId/like',asyncHandler(async(req,res)=>{
  const postId = req.params.postId;
  
  const post = await Post.findById(postId);

  post.likeCount++;

  await post.save();

  res.status(200).send({message:"게시글 공감하기 성공"});
}));

//게시글 공개 여부 확인
app.get('api/posts/:postId/is-public',asyncHandler(async(req,res)=>{
  const postId = req.params.postId;
  const post = await Post.findById(postId);

  res.status(200).json({
    id: post._id,
    isPublic: post.isPublic,
  });
}));


// 댓글 등록
app.post('/api/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  const { nickname, content, password } = req.body;

  if (!nickname || !content || !password) {
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }

  try {
    const newComment = new Comment({
      nickname,
      content,
      createdAt: new Date(),
    });

    await newComment.save();

    return res.status(200).json({
      id: newComment._id,
      nickname: newComment.nickname,
      content: newComment.content,
      createdAt: newComment.createdAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 댓글 목록 조회
app.get('/api/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  const { commentId, page = 1, pageSize = 10} = req.query;


  if (isNaN(page) || isNaN(pageSize) || page <= 0 || pageSize <= 0) {
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }

  try {
    const filter = { postId };
    if (commentId) {
      filter._id = { $gt: commentId };
    }

    const totalItemCount = await Comment.countDocuments(filter);

    const comments = await Comment.find(filter)
        .sort({ _id: 1 })
        .skip((page - 1) * pageSize)
        .limit(parseInt(pageSize));

    const totalPages = Math.ceil(totalItemCount / pageSize);

    return res.status(200).json({
      currentPage: parseInt(page),
      totalPages,
      totalItemCount,
      data: comments.map(comment => ({
        id: comment._id,
        nickname: comment.nickname,
        content: comment.content,
        createdAt: comment.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});


mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));
app.listen(3000, () => console.log('Server Started'));