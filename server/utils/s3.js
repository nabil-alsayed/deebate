// server/utils/s3.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const awsAccess = process.env.AWS_ACCESS;
const awsSecret = process.env.AWS_SECRET;

const s3Client = new S3Client({
    region: bucketRegion,
    credentials: {
        accessKeyId: awsAccess,
        secretAccessKey: awsSecret,
    },
});

const uploadImageToS3 = async (file, userId) => {
    const fileKey = `uploads/${userId}-${Date.now()}-${file.originalname}`;

    const uploadParams = {
        Bucket: bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        const imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileKey}`;
        return imageUrl;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw new Error("Failed to upload image to S3");
    }
};

module.exports = { uploadImageToS3 };
