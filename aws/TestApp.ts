import * as CDK from 'aws-cdk-lib'
import { AppProps } from 'aws-cdk-lib'
import { WebhookReceiverStack } from './WebhookReceiverStack.js'

export class TestApp extends CDK.App {
	public constructor({
		stackName,
		context,
	}: {
		stackName: string
		context?: AppProps['context']
	}) {
		super({ context })
		new WebhookReceiverStack(this, stackName)
	}
}
