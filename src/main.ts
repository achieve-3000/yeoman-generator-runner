import * as git from './git'
import * as github from './github'
import * as yeoman from './yeoman'
import * as core from '@actions/core'

async function run(): Promise<void> {
  try {
    const yo = yeoman.createEnv()

    core.info(`Running yeoman in ${yo.cwd}`)
    process.chdir(yo.cwd)

    core.info(`Instaling generator package`)
    await yeoman.installDependencies(yo)
    core.info(`Packages instaled`)

    core.info(`Running generator`)
    await yeoman.run(yo)
    core.info(`Generator done`)

    core.info(`Excluding tracked files`)
    await git.excludeUntrackedFiles()
    core.info(`Exclude configuration complete`)

    core.info(`Figuring out if files changed`)
    const filesChanged = await git.diffFiles()
    const changed = filesChanged.length > 0
    core.info(`Files changed : ${filesChanged}`)

    if (changed) {
      await git.configure()
      await git.createBranch()
      await git.commitChanges()
      await git.pushGithubPrBranch()
      await github.openPullRequest()
    }

    core.setOutput('changed', changed)
    core.setOutput('filesChanged', filesChanged)
  } catch (error) {
    core.setFailed(error)

    throw error
  }
}

run()
