import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { consoleReporter, runFolder } from '@nordicsemiconductor/bdd-markdown'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import * as path from 'path'
import { stackBaseName } from '../aws/stackBaseName.js'
import { steps } from './steps/webhook-steps.js'

/**
 * This file configures the BDD Feature runner
 * by loading the configuration for the test resources
 * (like AWS services) and providing the required
 * step runners and reporters.
 */

const config = await stackOutput(new CloudFormationClient({}))<{
	ApiURL: string
	QueueURL: string
}>(`${stackBaseName()}-test`)

export type World = {
	webhookReceiver: string
	webhookQueue: string
}

const runner = await runFolder<World>(path.join(process.cwd(), 'features'))

runner.addStepRunners(...steps())

const res = await runner.run({
	webhookReceiver: config.ApiURL,
	webhookQueue: config.QueueURL,
})

consoleReporter(res)

if (!res.ok) process.exit(1)
