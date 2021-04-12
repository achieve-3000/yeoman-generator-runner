import {Params} from './input'
import {StorageAdapter} from './adapter'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import Environment from 'yeoman-environment'

export class YeomanRunner {
  params: Params
  env: Environment<Environment.Options>

  constructor(
    params: Params,
    env: Environment<Environment.Options> | undefined = undefined
  ) {
    this.params = params
    this.env =
      env ||
      Environment.createEnv(
        [],
        {cwd: params.cwd},
        new StorageAdapter(params.answers)
      )
  }

  async installDependencies(): Promise<Environment.LookupGeneratorMeta[]> {
    const packages = this.params.packages
    const command = this.params.npmSudo ? 'sudo npm' : 'npm'

    if (packages) {
      core.info(`Instaling ${packages}`)
      await exec.exec(command, ['install', packages, '--global', '--quiet'])
    }

    core.info(`Indexing generators`)
    return this.env.lookup()
  }

  async run(): Promise<void> {
    const generator = this.params.generator
    const skipInstall = this.params.skipInstall
    const options: object = {
      ...this.params.options,
      skipInstall,
      force: true
    }

    return new Promise((resolve, reject) => {
      core.info(`Running generator ${generator}`)

      this.env.run(generator, options, err => {
        core.info(`Generator ${generator} done`)

        return err ? reject(err) : resolve()
      })
    })
  }
}
