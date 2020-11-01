const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; // 버킷명
  const Key = event.Records[0].s3.object.key; // 파일명
  const filename = Key.split('/')[Key.split('/').length - 1]; // 폴더명 제외한 순수한 파일명
  const ext = Key.split('.')[Key.split('.').length - 1]; // 파일의 확장자
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext; // sharp에서는 jpg 대신 jpeg 사용합니다.
  console.log('name', filename, 'ext', ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise(); // 버퍼로 가져오기
    console.log('original', s3Object.Body.length);
    const resizedImage = await sharp(s3Object.Body) // 리사이징
      .resize(400, 400, { fit: 'inside' }) // 비율 유지하면서 꽉찬 이미지
      .toFormat(requiredFormat)
      .toBuffer();
    await s3.putObject({ // thumb 폴더에 저장
      Bucket,
      Key: `thumb/${filename}`,
      Body: resizedImage,
    }).promise();
    console.log('put', resizedImage.length);
    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
