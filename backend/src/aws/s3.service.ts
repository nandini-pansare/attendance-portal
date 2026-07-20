import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';


@Injectable()
export class S3Service {

    private s3 = new S3Client;
    constructor(){
        const accessKeyId = process.env.AWS_ACCESS_KEY;
        const secretAccessKey = process.env.AWS_SECRET_KEY;

        if (!accessKeyId || !secretAccessKey) {
            throw new Error("AWS credentials missing");
        }
        
        this.s3 = new S3Client({
            region: "eu-north-1",
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        }); 
    }

    async uploadFile(file: Express.Multer.File){
        const key = `notifications/${Date.now()}-${file.originalname}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: "nandini-test-bucket-2026",
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );

        return `https://nandini-test-bucket-2026.s3.eu-north-1.amazonaws.com/${key}`;
    }
}