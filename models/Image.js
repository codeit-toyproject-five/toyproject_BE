import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    }, // Base64 인코딩된 이미지 데이터
    contentType: {
        type: String,
        required: true
    }, // 이미지의 Content-Type (예: 'image/png')
    imageurl: {
      type: String,
      required: true
    }
});

const Image = mongoose.model('Image', ImageSchema);

export default Image;