import { stackBaseName } from './stackBaseName.js'
import { TestApp } from './TestApp.js'

new TestApp({
	stackName: `${stackBaseName()}-test`,
	context: {
		isTest: true,
	},
}).synth()
