import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as input from './input'

async function assumeUnchanged(
  pattern: string,
  files: string[]
): Promise<number> {
  if (files.length === 0) {
    core.warning(`Unable to find files using pattern ${pattern}`)

    return Promise.resolve(0)
  }

  return exec.exec('git update-index --verbose --assume-unchanged', files)
}

async function globFiles(pattern: string): Promise<string[]> {
  const globber = await glob.create(pattern)
  const result = await globber.glob()

  return result
}

export async function configure(): Promise<number[]> {
  const config = input.getGitConfigInput()
  const promises = []

  for (const [key, value] of Object.entries(config)) {
    promises.push(exec.exec('git config --global', [key, value]))
  }

  return Promise.all(promises)
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
  const untrackedFiles = input.getUntrackedFilesInput()
  const promises = untrackedFiles.map(async pattern => {
    const files = await globFiles(pattern)
    const result = await assumeUnchanged(pattern, files)

    return result
  })

  return Promise.all(promises)
}
