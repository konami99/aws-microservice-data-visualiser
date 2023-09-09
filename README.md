# Weather data visualiser

![weather_monitor drawio](https://github.com/konami99/aws-microservice-data-fetcher/assets/166879/43487afb-b5ec-4b2c-84b8-a1ec66d29812)

This repo is the "visualiser" part of the weather monitor. It is comprised of a Lambda function and S3 bucket. The Lambda function pulls weather data from DynamoDB, generates `index.html` and pushes it up to S3. S3 is configured as static website.

I used Terraform to provision S3 static website because Terraform has good documentation about S3. I also referred to [this article](https://www.alexhyett.com/terraform-s3-static-website-hosting/).

Of course I can front the S3 with CloudFront to make it support SSL/TLS, but I'll skip that for now.

## Sample index.html

I created a [sample html](https://codepen.io/konami99/pen/rNoamNr) to help me build the UI. The Lambda replaces the x-axis with datetime, and y-axis with temperature. The generated `index.html` looks like this:

<img width="1173" alt="Screen Shot 2023-09-09 at 10 21 27 pm" src="https://github.com/konami99/aws-microservice-data-visualiser/assets/166879/ea19b15e-884f-4dc8-9f5b-f9c34f782255">

## S3 Configurations
The bucket policy was obtained from [this article on AWS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteAccessPermissionsReqd.html)

<img width="770" alt="Screen Shot 2023-09-09 at 10 28 10 pm" src="https://github.com/konami99/aws-microservice-data-visualiser/assets/166879/f8bf5a94-efe8-4a80-b61e-6a6f772dc5f8">

Converting it to Terraform:

`.deploy/terraform/static-site/iam.tf`

```
data "aws_iam_policy_document" "website_policy" {
  statement {
    actions = [
      "s3:GetObject"
    ]
    principals {
      identifiers = ["*"]
      type = "AWS"
    }
    resources = [
      "arn:aws:s3:::${var.bucket_name}/*"
    ]
  }
}
```

The bucket also needs to enable all public access:

<img width="718" alt="Screen Shot 2023-09-09 at 10 32 58 pm" src="https://github.com/konami99/aws-microservice-data-visualiser/assets/166879/0b64bad3-33a5-41a8-a687-137597458f11">

And this part does exactly that:

`.deploy/terraform/static-site/s3.tf`

```
resource "aws_s3_bucket_public_access_block" "public_access_block" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
```

## Final Configured Bucket
The final configured bucket looks like this:
<img width="970" alt="Screen Shot 2023-09-09 at 10 38 09 pm" src="https://github.com/konami99/aws-microservice-data-visualiser/assets/166879/fd2f2a34-f714-490b-aa53-36a2c6d4fb39">
<img width="778" alt="Screen Shot 2023-09-09 at 10 38 22 pm" src="https://github.com/konami99/aws-microservice-data-visualiser/assets/166879/0f7560e0-a3fb-498e-b204-b4eee55c4a63">
<img width="635" alt="Screen Shot 2023-09-09 at 10 38 45 pm" src="https://github.com/konami99/aws-microservice-data-visualiser/assets/166879/e5fb4b36-8db9-4327-8381-662d796712fe">
<img width="479" alt="Screen Shot 2023-09-09 at 10 45 33 pm" src="https://github.com/konami99/aws-microservice-data-visualiser/assets/166879/b268a84e-0762-40b0-886e-da994fe36abb">
