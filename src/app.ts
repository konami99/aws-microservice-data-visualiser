import { S3 } from "aws-sdk";

const bucketName = process.env.DestinationBucketName as string;

const s3 = new S3();

export const lambdaHandler = async (event: any): Promise<any> => {
  try {
		await s3.putObject({
			Bucket: bucketName,
			Key: 'index.html',
			Body: '<html><head></head><body>this is a test 123</body></html>'
		}).promise();
				
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'hello world',
			}),
		};
	} catch (err) {
		console.log(err);
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'some error happened',
			}),
		};
	}
};
