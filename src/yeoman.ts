import {Answers} from 'inquirer'

import * as input from './input'
import {StorageAdapter} from './adapter'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import Environment from 'yeoman-environment'

export function createEnv(): Environment<Environment.Options> {
  const cwd = core.getInput('cwd')
  const answers = input.getJsonInput<Answers>('answers')
  const env = Environment.createEnv([], {cwd}, new StorageAdapter(answers))

  return env
}

export async function installDependencies(
  env: Environment<Environment.Options>
): Promise<Environment.LookupGeneratorMeta[]> {
  const packages = core.getInput('package')

  core.info(`Instaling ${packages}`)
  await exec.exec('sudo npm', ['install', packages, '--global', '--quiet'])

  core.info(`Indexing generators`)
  return env.lookup()
}

export async function run(
  env: Environment<Environment.Options>
): Promise<void> {
  const generator = core.getInput('generator')
  const skipInstall = input.getJsonInput<boolean>('skip-install')
  const options: object = {
    ...input.getJsonInput<Record<string, object>>('options'),
    skipInstall,
    force: true
  }

  return new Promise((resolve, reject) => {
    core.info(`Running generator ${generator}`)

    env.run(generator, options, err => {
      core.info(`Generator ${generator} done`)

      return err ? reject(err) : resolve()
    })
  })
}
