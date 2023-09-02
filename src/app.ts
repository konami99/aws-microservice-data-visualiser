import AWS from "aws-sdk";

const bucketName = process.env.DestinationBucketName as string;

const s3 = new AWS.S3();
const dynamoDBClient = new AWS.DynamoDB.DocumentClient();

const indexTemplate = (labels: string, data: string): string => {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Chart.js Example</title>
				<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
			</head>
			<body>
				<div style="width: 80%; margin: auto;">
					<canvas id="myChart"></canvas>
				</div>
				<script>
					// Sample data for the chart
					const data = {
	` +
	
						labels
		+
	`
						datasets: [{
							label: "Sydney's temperature",
							backgroundColor: 'rgba(75, 192, 192, 0.2)',
							borderColor: 'rgba(75, 192, 192, 1)',
	` +
	
							data
		+
	`
							fill: false,
						}]
					};
					// Chart configuration
					const config = {
						type: 'line',
						data: data,
						options: {
							scales: {
								y: {
									beginAtZero: true
								}
							}
						}
					};
					// Get the canvas element and create the chart
					const ctx = document.getElementById('myChart').getContext('2d');
					const myChart = new Chart(ctx, config);
				</script>
			</body>
		</html>
	`
}

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
			Body: indexTemplate(`labels: ['January', 'February', 'March', 'April', 'May'],`, `data: [65, 59, 80, 81, 56],`)
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
