import AWS from "aws-sdk";
import { format } from "date-fns";

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

type Weather = {
	city: string,
	humidity: number,
	datetime: number,
	temperature: number
}

const unixTimeToTime = (unixTime: number): string => {
	const date = new Date(unixTime);
	return format(date, 'HH:mm');
}

const generateLabels = (items: Weather[]): string => {
	// return `labels: ['January', 'February', 'March', 'April', 'May'],`
	const reversedItems = items.slice().reverse();
	var labels = `labels: [`
	reversedItems.forEach((item: Weather, index) => {
		labels += `'` + unixTimeToTime(item.datetime) + `'`;
		if (index < items.length - 1) {
			labels += `, `;
		}
	})
	labels += `],`
	return labels
}

const generateData = (items: Weather[]): string => {
	// return `data: [65, 59, 80, 81, 56],`
	const reversedItems = items.slice().reverse();
	var data = `data: [`
	reversedItems.forEach((item: Weather, index) => {
		data += item.temperature;
		if (index < items.length - 1) {
			data += `, `;
		}
	})
	data += `],`
	return data
}

export const lambdaHandler = async (event: any): Promise<any> => {
  try {
		var params: AWS.DynamoDB.DocumentClient.QueryInput = {
			TableName: 'newweatherdata',
			KeyConditionExpression: 'city = :partitionKeyValue',
			ExpressionAttributeValues: { ':partitionKeyValue': 'Sydney' },
			ScanIndexForward: false,
			Limit: 10
		}

		const result = await dynamoDBClient.query(params).promise();
		/*
		{
			Items: [
				{
					city: 'Sydney',
					humidity: 61,
					datetime: 1692519781720, //20 August 2023 08:23:01.720
					temperature: 16.34
				},
				{
					city: 'Sydney',
					humidity: 61,
					datetime: 1692519721614, //20 August 2023 08:22:01.614
					temperature: 16.42
				},
				{
					city: 'Sydney',
					humidity: 61,
					datetime: 1692519662220, //20 August 2023 08:21:02.220
					temperature: 16.42
				}
			],
			Count: 3,
			ScannedCount: 3
		}
		*/

		console.log(result);

		const labels: string = generateLabels(result['Items'] as Weather[]);
		const data: string = generateData(result['Items'] as Weather[]);
			
		await s3.putObject({
			ContentType: 'text/html',
			Bucket: bucketName,
			Key: 'index.html',
			Body: indexTemplate(labels, data)
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
