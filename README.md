# PR Commit Changelog

This github action updates the description of the PR with the commit changelog.

# Usage

This action doesn't create a PR, but updates it.

```yml
name: Creates and Updates PR
on:
  push:
    branches:
    - some-branch
jobs:
  pull-request:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: update-pull-request
      uses: paperboxai/Github-Action-PR-Commit-Changelog@v1.0.0
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
```



# Parameters

## Inputs

### `github_token`

The GITHUB_TOKEN secret. This is required.

# LICENSE

MIT
