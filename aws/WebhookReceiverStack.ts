import * as CDK from 'aws-cdk-lib'
import * as IAM from 'aws-cdk-lib/aws-iam'
import * as Lambda from 'aws-cdk-lib/aws-lambda'
import * as Logs from 'aws-cdk-lib/aws-logs'
import * as SQS from 'aws-cdk-lib/aws-sqs'
import { readFileSync } from 'fs'
import * as path from 'path'

/**
 * This is the CloudFormation stack which contains the webhook receiver resources.
 */
export class WebhookReceiverStack extends CDK.Stack {
	public constructor(parent: CDK.App, id: string) {
		super(parent, id)

		const enableTracing = this.node.tryGetContext('isTest') === true

		// This queue will store all the requests made to the API Gateway
		const queue = new SQS.Queue(this, 'queue', {
			fifo: true,
			visibilityTimeout: CDK.Duration.seconds(5),
			queueName: `${id}.fifo`,
		})

		// Add X-Ray layer
		const layers: Lambda.ILayerVersion[] = []
		if (enableTracing)
			layers.push(
				Lambda.LayerVersion.fromLayerVersionArn(
					this,
					'X-RayLayer',
					`arn:aws:lambda:${this.region}:901920570463:layer:aws-otel-nodejs-amd64-ver-1-6-0:1`,
				),
			)

		// This lambda will publish all requests made to the API Gateway in the queue
		const lambda = new Lambda.Function(this, 'Lambda', {
			description: 'Publishes webhook requests into SQS',
			code: Lambda.Code.fromInline(
				readFileSync(
					path.resolve(process.cwd(), 'aws', 'lambda.js'),
					'utf-8',
				).toString(),
			),
			handler: 'index.handler',
			runtime: Lambda.Runtime.NODEJS_16_X,
			architecture: Lambda.Architecture.X86_64,
			timeout: CDK.Duration.seconds(15),
			initialPolicy: [
				new IAM.PolicyStatement({
					resources: ['arn:aws:logs:*:*:*'],
					actions: [
						'logs:CreateLogGroup',
						'logs:CreateLogStream',
						'logs:PutLogEvents',
					],
				}),
				new IAM.PolicyStatement({
					resources: [queue.queueArn],
					actions: ['sqs:SendMessage'],
				}),
			],
			environment: {
				SQS_QUEUE: queue.queueUrl,
			},
			tracing: enableTracing ? Lambda.Tracing.ACTIVE : Lambda.Tracing.DISABLED,
			layers,
		})

		if (enableTracing)
			lambda.addToRolePolicy(
				new IAM.PolicyStatement({
					resources: ['*'],
					actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
				}),
			)

		// Create the log group here, so we can control the retention
		new Logs.LogGroup(this, `LambdaLogGroup`, {
			removalPolicy: CDK.RemovalPolicy.DESTROY,
			logGroupName: `/aws/lambda/${lambda.functionName}`,
			retention: Logs.RetentionDays.ONE_DAY,
		})

		const fnUrl = lambda.addFunctionUrl({
			authType: Lambda.FunctionUrlAuthType.NONE,
		})

		// Export these so the test runner can use them
		new CDK.CfnOutput(this, 'ApiURL', {
			value: fnUrl.url,
			exportName: `${this.stackName}:ApiURL`,
		})
		new CDK.CfnOutput(this, 'QueueURL', {
			value: queue.queueUrl,
			exportName: `${this.stackName}:QueueURL`,
		})
	}
}
