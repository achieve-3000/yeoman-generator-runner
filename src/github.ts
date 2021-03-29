import * as input from './input'
import {GitHub} from '@actions/github/lib/utils'

import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'

type ListPullsResponse = RestEndpointMethodTypes['pulls']['list']['response']
type CreatePullResponse = RestEndpointMethodTypes['pulls']['create']['response']

function githubClient(): InstanceType<typeof GitHub> {
  const token = input.getInput('github-token')
  const octokit = getOctokit(token)

  return octokit
}

function refBase(): string {
  return context.ref.split('/').slice(2).join('/')
}

async function findOpenPull(
  octokit: InstanceType<typeof GitHub>
): Promise<ListPullsResponse['data'][0]> {
  const base = refBase()
  const head = input.getGithubPrBranchInput()
  const result: ListPullsResponse = await octokit.rest.pulls.list({
    ...context.repo,
    state: 'open',
    head
  })

  const data: ListPullsResponse['data'] = result.data
  const pull = data.find(
    d => d.head.ref === head && d.base.ref === base
  ) as ListPullsResponse['data'][0]

  return pull
}

async function createPull(
  octokit: InstanceType<typeof GitHub>
): Promise<CreatePullResponse['data']> {
  const base = refBase()
  const body = input.getGithubPrBodyInput()
  const title = input.getGithubPrTitleInput()
  const head = input.getGithubPrBranchInput()
  const result: CreatePullResponse = await octokit.pulls.create({
    body,
    title,
    base,
    head,
    ...context.repo
  })

  return result.data
}

export async function openPullRequest(): Promise<number> {
  const octokit = githubClient()
  const existing = await findOpenPull(octokit)

  if (existing) {
    core.info(`Skiping new pull request, Found ${existing.html_url}`)

    return Promise.resolve(existing.id)
  }

  const newPull = await createPull(octokit)

  core.info(`Created new pull request ${newPull.html_url}`)

  return Promise.resolve(newPull.id)
}
