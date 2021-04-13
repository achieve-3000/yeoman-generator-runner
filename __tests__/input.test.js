const {readParams} = require('../src/input');
const process = require('process');
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');

beforeEach(() => {
  const filePath = path.resolve(__dirname, '../', 'action.yml')
  const contents = fs.readFileSync(filePath, 'utf8')
  const data = yaml.load(contents)

  for (const key in data.inputs) {
    const envName = `INPUT_${key.toUpperCase()}`
    const envValue = data.inputs[key].default || ''

    process.env[envName] = envValue
  }
})

test('readParams defaults', () => {
  process.env['INPUT_GENERATOR'] = 'test'

  expect(readParams()).toEqual({
    packages: '',
    generator: 'test',
    untrackedFiles: [],
    skipInstall: true,
    answers: {},
    options: {},
    cwd: '.',
    npmSudo: true,
    gitConfig: {
      'user.name': 'github-actions',
      'user.email': 'github-actions@github.com'
    },
    gitRemoteOriginUrl: '',
    githubToken: '',
    githubPrCommitMessage: 'Run generator test',
    githubPrBranch: 'generator/test',
    githubPrTitle: 'Run generator test',
    githubPrBody: 'Run generator test'
  })
})

test('readParams values', () => {
  process.env['INPUT_GENERATOR'] = 'test'
  process.env['INPUT_PACKAGE'] = 'generator-test'
  process.env['INPUT_UNTRACKED-FILES'] = '["./src"]'
  process.env['INPUT_SKIP-INSTALL'] = 'true'
  process.env['INPUT_ANSWERS'] = '{"my_question":"my_answers"}'
  process.env['INPUT_OPTIONS'] = '{"my_options":"my_value"}'
  process.env['INPUT_CWD'] = './generated'
  process.env['INPUT_NPM-SUDO'] = 'true'
  process.env['INPUT_GIT-CONFIG'] = '{"user.name":"github"}'
  process.env['INPUT_GIT-REMOTE-ORIGIN-URL'] = 'https://github.com/test/repo'
  process.env['INPUT_GITHUB-TOKEN'] = 'my token'
  process.env['INPUT_GITHUB-PR-COMMIT-MESSAGE'] = 'My commit message'
  process.env['INPUT_GITHUB-PR-BRANCH'] = 'generator/my-branch'
  process.env['INPUT_GITHUB-PR-TITLE'] = 'Generator PR title'
  process.env['INPUT_GITHUB-PR-BODY'] = 'Generator PR Body'

  expect(readParams()).toEqual({
    packages: 'generator-test',
    generator: 'test',
    untrackedFiles: ['./src'],
    skipInstall: true,
    answers: {my_question: 'my_answers'},
    options: {my_options: 'my_value'},
    cwd: './generated',
    npmSudo: true,
    gitConfig: {'user.name': 'github'},
    gitRemoteOriginUrl: 'https://github.com/test/repo',
    githubToken: 'my token',
    githubPrCommitMessage: 'My commit message',
    githubPrBranch: 'generator/my-branch',
    githubPrTitle: 'Generator PR title',
    githubPrBody: 'Generator PR Body'
  })
})

test('readParams invalid json', () => {
  process.env['INPUT_GENERATOR'] = 'test'
  process.env['INPUT_ANSWERS'] = '{"my_question}'

  expect(readParams).toThrow('Unexpected end of JSON input')
})
