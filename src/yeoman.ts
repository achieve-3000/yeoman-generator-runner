import {Answers} from 'inquirer'

import * as input from './input'
import {StorageAdapter} from './adapter'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import Environment from 'yeoman-environment'

export function createEnv(): Environment<Environment.Options> {
  const cwd = input.getInput('cwd')
  const answers = input.getJsonInput<Answers>('answers')
  const env = Environment.createEnv([], {cwd}, new StorageAdapter(answers))

  return env
}

export async function installDependencies(
  env: Environment<Environment.Options>
): Promise<Environment.LookupGeneratorMeta[]> {
  const packages = input.getInput('package')
  const sudo = input.getJsonInput('npm-sudo')
  const command = sudo ? 'sudo npm' : 'npm'

  core.info(`Instaling ${packages}`)
  await exec.exec(command, ['install', packages, '--global', '--quiet'])

  core.info(`Indexing generators`)
  return env.lookup()
}

export async function run(
  env: Environment<Environment.Options>
): Promise<void> {
  const generator = input.getInput('generator')
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
