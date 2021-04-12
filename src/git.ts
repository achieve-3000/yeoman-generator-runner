import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as fs from 'fs'

import {Params} from './input'

async function assumeUnchanged(
  pattern: string,
  files: string[]
): Promise<number> {
  if (files.length === 0) {
    core.warning(`Unable to find files using pattern ${pattern}`)

    return Promise.resolve(0)
  }

  const command = 'git update-index --verbose --assume-unchanged'
  const filter = (file: string): boolean => fs.lstatSync(file).isFile()

  return exec.exec(command, files.filter(filter))
}

async function globFiles(pattern: string): Promise<string[]> {
  const globber = await glob.create(pattern)
  const result = await globber.glob()

  return result
}

export class GitAdapter {
  params: Params

  constructor(params: Params) {
    this.params = params
  }

  async configure(): Promise<number[]> {
    const originUrl = this.params.gitRemoteOriginUrl
    const config = this.params.gitConfig
    const codes = []

    for (const [key, value] of Object.entries(config)) {
      codes.push(await exec.exec('git config --global', [key, value]))
    }

    if (originUrl) {
      codes.push(await exec.exec('git remote set-url origin', [originUrl]))
    }

    return Promise.resolve(codes)
  }

  async diffFiles(): Promise<string[]> {
    const lines: string[] = []
    const command = 'git diff --name-only HEAD .'
    const options = {
      listeners: {
        stdline: (line: string) => {
          lines.push(line)
        }
      }
    }

    await exec.exec(command, [], options)

    if (lines.length > 0) {
      await exec.exec('git status')
      await exec.exec('git diff --stat HEAD .')
    }

    return lines
  }

  async addFiles(): Promise<number> {
    return exec.exec('git add .')
  }

  async commitChanges(): Promise<number> {
    const command = 'git commit -m'
    const message = this.params.githubPrCommitMessage

    return exec.exec(command, [message])
  }

  async createBranch(): Promise<number> {
    const command = 'git checkout -b'
    const branch = this.params.githubPrBranch

    return exec.exec(command, [branch])
  }

  async pushGithubPrBranch(): Promise<number> {
    const branch = this.params.githubPrBranch
    const command = 'git push origin'

    return exec.exec(command, [branch, '--force'])
  }

  async excludeUntrackedFiles(): Promise<number[]> {
    const codes = []
    const untrackedFiles = this.params.untrackedFiles

    for (const pattern of untrackedFiles) {
      const files = await globFiles(pattern)
      const result = await assumeUnchanged(pattern, files)

      codes.push(result)
    }

    return Promise.resolve(codes)
  }

  async revertUntrackedFiles(): Promise<number[]> {
    const codes = []
    const untrackedFiles = this.params.untrackedFiles

    for (const pattern of untrackedFiles) {
      codes.push(await exec.exec('git restore --staged', [pattern]))
      codes.push(await exec.exec('git checkout HEAD', [pattern]))
    }

    return Promise.resolve(codes)
  }
}
