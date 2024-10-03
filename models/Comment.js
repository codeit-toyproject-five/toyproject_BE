import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId, // 게시물 ID 참조
            required: true,
            ref: 'Post', // 게시물과 연결되는 경우 사용 (Post 모델이 있는 경우)
        },
        nickname: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true, // 비밀번호 필수
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }
);

const Comment = mongoose.model('Comment',CommentSchema);

export default Comment;