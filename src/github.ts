import {Params} from './input'
import {GitHub} from '@actions/github/lib/utils'

import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods'

type ListPullsResponse = RestEndpointMethodTypes['pulls']['list']['response']
type CreatePullResponse = RestEndpointMethodTypes['pulls']['create']['response']

type CreatePullDataResponse = CreatePullResponse['data']
type ListPullsDataResponse = ListPullsResponse['data']
type ListPullsDataItemResponse = ListPullsResponse['data'][0]

function refBase(): string {
  return context.ref.split('/').slice(2).join('/')
}

export class GithubAdapter {
  params: Params
  octokit: InstanceType<typeof GitHub>

  constructor(
    params: Params,
    octokit: InstanceType<typeof GitHub> | undefined = undefined
  ) {
    this.params = params
    this.octokit = octokit || getOctokit(params.githubToken)
  }

  async findOpenPull(): Promise<ListPullsDataItemResponse> {
    const base = refBase()
    const head = this.params.githubPrBranch
    const result: ListPullsResponse = await this.octokit.rest.pulls.list({
      ...context.repo,
      state: 'open',
      head
    })

    const data: ListPullsDataResponse = result.data
    const pull = data.find(
      d => d.head.ref === head && d.base.ref === base
    ) as ListPullsDataItemResponse

    return pull
  }

  async createPull(): Promise<CreatePullDataResponse> {
    const result: CreatePullResponse = await this.octokit.pulls.create({
      ...context.repo,
      base: refBase(),
      body: this.params.githubPrBody,
      title: this.params.githubPrBody,
      head: this.params.githubPrBranch
    })

    return result.data
  }

  async openPullRequest(): Promise<number> {
    const existing = await this.findOpenPull()

    if (existing) {
      core.info(`Skiping new pull request, Found ${existing.html_url}`)

      return Promise.resolve(existing.id)
    }

    const newPull = await this.createPull()

    core.info(`Created new pull request ${newPull.html_url}`)

    return Promise.resolve(newPull.id)
  }
}
