import * as core from '@actions/core'

export function getInput(name: string, defaultValue = ''): string {
  return core.getInput(name) || defaultValue
}

export function getJsonInput<T>(name: string): T {
  const input = getInput(name)

  try {
    return JSON.parse(input)
  } catch (e) {
    core.error(`Failed to parse json input ${name}:'${input}'`)
    throw e
  }
}

export function getGitConfigInput(): Record<string, string> {
  return getJsonInput<Record<string, string>>('git-config')
}

export function getGithubPrCommitMessageInput(): string {
  return getInput(
    'github-pr-commit-message',
    `Run generator ${getInput('generator')}`
  )
}

export function getGithubPrBranchInput(): string {
  return getInput('github-pr-branch', `generator/${getInput('generator')}`)
}

export function getGithubPrBodyInput(): string {
  return getInput('github-pr-body', `Run generator ${getInput('generator')}`)
}

export function getGithubPrTitleInput(): string {
  return getInput('github-pr-title', `Run generator ${getInput('generator')}`)
}

export function getUntrackedFilesInput(): string[] {
  return getJsonInput<string[]>('untracked-files')
}
