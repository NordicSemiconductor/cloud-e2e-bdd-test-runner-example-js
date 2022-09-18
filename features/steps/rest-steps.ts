import {
	noMatch,
	StepRunner,
	StepRunnerArgs,
	StepRunResult,
} from '@nordicsemiconductor/bdd-markdown'
import assert from 'assert/strict'
import fetch, { Response } from 'node-fetch'
import { World } from '../run-features.js'

export const steps = (): StepRunner<World>[] => {
	let baseUrl: URL | undefined = undefined
	let res: Response | undefined = undefined
	return [
		async ({ step }: StepRunnerArgs<World>): Promise<StepRunResult> => {
			const match = /^the endpoint is `(?<endpoint>[^`]+)`$/.exec(step.title)
			if (match === null) return noMatch
			baseUrl = new URL(match.groups?.endpoint)
			return {
				matched: true,
			}
		},
		async ({
			step,
			log: {
				step: { progress },
			},
		}: StepRunnerArgs<World>): Promise<StepRunResult> => {
			const match =
				/^I (?<method>POST) to `(?<resource>[^`]+)` with this JSON$/.exec(
					step.title,
				)
			if (match === null) return noMatch
			const url = new URL(match.groups?.resource ?? '/', baseUrl).toString()
			const method = match.groups?.method ?? 'GET'
			progress(`${method} ${url}`)
			progress(step.codeBlock.code)

			res = await fetch(url, {
				method,
				body: step.codeBlock.code,
			})

			return {
				matched: true,
			}
		},
		async ({ step }: StepRunnerArgs<World>): Promise<StepRunResult> => {
			const match = /^the response status code should be (?<code>[0-9]+)$/.exec(
				step.title,
			)
			if (match === null) return noMatch

			assert.equal(res?.status, parseInt(match.groups?.code, 10))

			return {
				matched: true,
			}
		},
	]
}
