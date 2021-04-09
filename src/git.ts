import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as input from './input'
import * as fs from 'fs'

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

export async function configure(): Promise<number[]> {
  const originUrl = input.getInput('git-remote-origin-url')
  const config = input.getGitConfigInput()
  const codes = []

  for (const [key, value] of Object.entries(config)) {
    codes.push(await exec.exec('git config --global', [key, value]))
  }

  if (originUrl) {
    codes.push(await exec.exec('git remote set-url origin', [originUrl]))
  }

  return Promise.resolve(codes)
}

export async function diffFiles(): Promise<string[]> {
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

export async function commitChanges(): Promise<number> {
  const command = 'git commit . -m'
  const message = input.getGithubPrCommitMessageInput()

  return exec.exec(command, [message])
}

export async function createBranch(): Promise<number> {
  const command = 'git checkout -b'
  const branch = input.getGithubPrBranchInput()

  return exec.exec(command, [branch])
}

export async function pushGithubPrBranch(): Promise<number> {
  const branch = input.getGithubPrBranchInput()
  const command = 'git push origin'

  return exec.exec(command, [branch, '--force'])
}

export async function excludeUntrackedFiles(): Promise<number[]> {
  const codes = []
  const untrackedFiles = input.getUntrackedFilesInput()

  for (const pattern of untrackedFiles) {
    const files = await globFiles(pattern)
    const result = await assumeUnchanged(pattern, files)

    codes.push(result)
  }

  return Promise.resolve(codes)
}
