import express from 'express';
import mongoose from 'mongoose';
import {DATABASE_URL} from './env.js';
import Group from './models/Group.js';
import Post from './models/Post.js';
import Image from './models/Image.js';
import Comment from './models/Comment.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import multer from 'multer';

const app = express();
app.use(express.json());
const upload = multer({dest:'uploads/'});



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
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
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

//그룹 수정
app.patch('/api/groups/:groupId',asyncHandler(async (req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  if(!group){
    return res.status(404).send({message : "존재하지 않습니다"});
  }
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

//그룹 삭제
app.delete('/api/groups/:groupId',asyncHandler(async (req,res)=>{
  const password = req.body.password;
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  if(!group){
    return res.status(404).send({message: "존재하지 않습니다"});
  }
  if(password !== group.password){
    return res.status(403).send({message: "비밀번호가 틀렸습니다"});
  }
  await Group.findByIdAndDelete(groupId);
  res.status(200).send({message: "그룹 삭제 성공"});
}));

//그룹 상세 정보 조회
app.get('/api/groups/:groupId',async (req,res)=>{
  try{
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId);

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
  }catch(e){
    res.status(400).send({message:"잘못된 요청입니다"});
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
    return res.status(401).send({message:"비밀번호가 틀렸습니다"});
  }
}));

//그룹 공감하기
app.post('/api/groups/:groupId/like',asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  if(!group){
    return res.status(404).send({message: "존재하지 않습니다"});
  }
  group.likeCount++;
  if(group.likeCount=10000){
    group.badges.push("그룹 공간 1만 개 이상 받기");
  }
  await group.save();
  res.status(200).send({message: "그룹 공감하기 성공"});
}));

//그룹 공개 여부 확인
app.get('/api/groups/:groupId/is-public',asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  res.status(200).json({
    id: group._id,
    isPublic: Boolean(group.isPublic)
  });
}));

//게시글 등록
app.post('/api/groups/:groupId/posts', asyncHandler(async(req,res)=>{
  const groupId = req.params.groupId;
  const group = Group.findById(groupId);
  const {nickname, title, content, postPassword, groupPassword,imageUrl, tags, location, moment, isPublic}=req.body;
  const post = new Post({
    groupId: groupId,
    nickname,
    title,
    content,
    postPassword,
    groupPassword,
    imageUrl,
    tags,
    location,
    moment,
    isPublic,
    likeCount:0,
    commentCount: 0,
    createdAt: Date.now(),
  });
  const savedPost = await post.save();
  group.postCount++;
  group.save();
  res.status(200).send({
    id: savedPost._id,
    groupId: savedPost.groupId,
    nickname: savedPost.nickname,
    title: savedPost.title,
    content: savedPost.content,
    imageUrl: savedPost.imageUrl,
    tags: savedPost.tags,
    location: savedPost.location,
    moment: savedPost.moment,
    isPublic: savedPost.isPublic,
    likeCount: savedPost.likeCount,
    commentCount: savedPost.commentCount,
    createdAt: savedPost.createdAt
  });
}));

//게시글 조회
app.get('/api/groups/:groupId/posts', async(req,res)=>{
  try{
  const groupId = req.params.groupId;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const sortBy = req.query.sortBy;
  const keyword = req.query.keyword;
  const isPublic = req.query.isPublic;

  //groupId유효성 검사
  await Group.findById(groupId);
  
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
  }catch(e){
    return res.status(400).send({message: "잘못된 요청입니다"});
  }
});

//게시글 수정
app.patch('/api/posts/:postId',asyncHandler(async(req,res)=>{
  const req_body = req.body;
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  const postPassword = req_body.postPassword;
  if(!post){
    return res.status(404).send({message: "존재하지 않습니다"});
  }

  post.nickname = req_body.nickname;
  post.title = req_body.title;
  post.content = req_body.content;
  post.imageUrl = req_body.imageUrl;
  post.tags = req_body.tags;
  post.location = req_body.location;
  post.moment = req_body.moment;
  post.isPublic = req_body.isPublic;

  if(post.postPassword !== postPassword){
    console.log(post.postPassword);
    console.log(postPassword);
    return res.status(403).send({message:"비밀번호가 틀렸습니다"});
  }

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
app.delete('/api/posts/:postId',asyncHandler(async(req,res)=>{
  const postId = req.params.postId;
  const postPassword = req.body.password;
  const post = await Post.findById(postId);
  const group = await Group.findById(post.groupId);
  if(!post){
    return res.status(404).send({message: "존재하지 않습니다"});
  }
  if(post.postPassword !== postPassword){
    return res.status(403).send({message: "비밀번호가 틀렸습니다"});
  }
  await Post.findByIdAndDelete(postId);
  group.postCount--;
  group.save();
  res.status(200).send({message: "게시글 삭제 성공"});
}));

//게시글 상세 정보 조회
app.get('api/posts/:postId',async(req,res)=>{
  try{
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
  }catch(e){
    res.status(400).send({message:"잘못된 요청입니다"});
  }
});

//게시글 조회 권한 확인
app.post('/api/posts/:postId/verify-password',async(req,res)=>{
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
app.post('/api/posts/:postId/like',asyncHandler(async(req,res)=>{
  const postId = req.params.postId;
  
  const post = await Post.findById(postId);
  if(!post){
    return res.status.send({message: "존재하지 않습니다"});
  }
  post.likeCount++;
  const likeCount = post.likeCount;

  if(likeCount===10000){
    const group = await Group.findById(post.groupId);
    group.badges.push("추억 공감 1만 개 이상 받기");
    await group.save();
  }

  await post.save();

  res.status(200).send({message:"게시글 공감하기 성공"});
}));

//게시글 공개 여부 확인
app.get('/api/posts/:postId/is-public',asyncHandler(async(req,res)=>{
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
    // postId가 유효한지 확인 (게시물이 존재하는지)
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '존재하지 않는 게시물입니다.' });
    }

    // 새로운 댓글 생성
    const newComment = new Comment({
      postId, // postId를 참조하여 댓글과 게시물 연결
      nickname,
      content,
      password,
      createdAt: new Date(),
    });

    // 댓글 저장
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
  const { page = 1, pageSize = 10 } = req.query;

  if (isNaN(page) || isNaN(pageSize) || page <= 0 || pageSize <= 0) {
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }

  try {
    // postId 필터링
    const filter = { postId };

    const totalItemCount = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter)
        .populate('postId', 'title') // 게시물 제목도 함께 조회
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
        postTitle: comment.postId.title, // 게시물 제목 추가
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

// 댓글 수정
app.put('/api/comments/:commentId', async (req, res) => {
  const { commentId } = req.params;
  const { nickname, content, password } = req.body;

  if (!nickname || !content || !password) {
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }

  try {
    const comment = await Comment.findById(commentId);

    // 댓글이 존재하지 않으면 404 응답
    if (!comment) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    // 비밀번호가 틀리면 403 응답
    if (comment.password !== password) {
      return res.status(403).json({ message: '비밀번호가 틀렸습니다' });
    }

    // 댓글 내용을 수정
    comment.nickname = nickname;
    comment.content = content;

    // 수정된 댓글을 저장
    await comment.save();

    // 성공 응답
    return res.status(200).json({
      id: comment._id,
      nickname: comment.nickname,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 댓글 삭제
app.delete('/api/comments/:commentId', async (req, res) => {
  const { commentId } = req.params;
  const { password } = req.body;

  // 요청 유효성 검사
  if (!password) {
    return res.status(400).json({ message: '잘못된 요청입니다' });
  }

  try {
    // 해당 댓글을 DB에서 찾음
    const comment = await Comment.findById(commentId);

    // 댓글이 존재하지 않으면 404 응답
    if (!comment) {
      return res.status(404).json({ message: '존재하지 않습니다' });
    }

    // 비밀번호가 틀리면 403 응답
    if (comment.password !== password) {
      return res.status(403).json({ message: '비밀번호가 틀렸습니다' });
    }

    // 댓글 삭제
    await comment.deleteOne();

    // 성공 응답
    return res.status(200).json({ message: '답글 삭제 성공' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 이미지 업로드
app.post('/api/image', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;

    // 파일이 없는 경우 처리
    if (!file) {
      return res.status(400).json({ message: '이미지 파일이 필요합니다' });
    }

    // 저장된 이미지 파일의 경로 생성 (서버 기준으로)
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    // 이미지 정보를 MongoDB에 저장
    const newImage = new Image({
      image: file.filename, // 실제 저장된 파일 이름을 저장
      contentType: file.mimetype,
    });

    await newImage.save();

    // 성공 응답으로 이미지 URL 반환
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러' });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     description: Deletes an existing comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: The password to authorize the deletion
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: Comment successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: Comment deleted successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Incorrect password
 *       404:
 *         description: Comment not found
 */


/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get a list of comments
 *     description: Retrieves a list of comments for a specific post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           description: The page number to retrieve
 *           example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           description: The number of comments per page
 *           example: 10
 *     responses:
 *       200:
 *         description: List of comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages
 *                 totalItemCount:
 *                   type: integer
 *                   description: The total number of comments
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The ID of the comment
 *                       nickname:
 *                         type: string
 *                         description: The nickname of the comment author
 *                       content:
 *                         type: string
 *                         description: The content of the comment
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: The time the comment was created
 *       400:
 *         description: Invalid request
 */

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Register a new comment
 *     description: Creates a new comment on a specific post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: The nickname of the comment author
 *                 example: john_doe
 *               content:
 *                 type: string
 *                 description: The content of the comment
 *                 example: This is a great post!
 *               password:
 *                 type: string
 *                 description: The password for modifying or deleting the comment
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: Comment successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created comment
 *                 nickname:
 *                   type: string
 *                   description: The nickname of the comment author
 *                 content:
 *                   type: string
 *                   description: The content of the comment
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The time the comment was created
 *       400:
 *         description: Invalid request
 */



mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));
app.listen(3000, () => console.log('Server Started'));