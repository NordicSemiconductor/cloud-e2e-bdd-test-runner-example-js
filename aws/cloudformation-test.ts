import { stackBaseName } from './stackBaseName'
import { TestApp } from './TestApp'

new TestApp({
	stackName: `${stackBaseName()}-test`,
}).synth()
