import AWS from "aws-sdk";

const bucketName = process.env.DestinationBucketName as string;

const s3 = new AWS.S3();
const dynamoDBClient = new AWS.DynamoDB.DocumentClient();

export const lambdaHandler = async (event: any): Promise<any> => {
  try {
		var params: AWS.DynamoDB.DocumentClient.QueryInput = {
			TableName: 'newweatherdata',
			KeyConditionExpression: 'city = :partitionKeyValue',
			ExpressionAttributeValues: { ':partitionKeyValue': 'Sydney' },
			Limit: 10
		}

		const data = await dynamoDBClient.query(params).promise();

		console.log(data);
			
		await s3.putObject({
			ContentType: 'text/html',
			Bucket: bucketName,
			Key: 'index.html',
			Body: '<!doctype html><html><head></head><body><h1>Hello this is a test!</h1></body></html>'
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
