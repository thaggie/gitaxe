# gitaxe

This is a command line tool to make it easy to delete local branches in a git repository.

**Use with caution, if you delete a local branch that hasn't been pushed to remote there's no retrieving that work.**

## Installation

`npm install -g gitaxe`

## Usage

`gitaxe`

* You will then be presented with a list of the local branches of your git repository, check the ones you want to delete using the arrow keys and space bar, press enter when done.
* If don't check any branches `gitaxe` will just exit.
* You will then need to confirm that you do indeed want to delete the selected branches.
* If you say **yes** `gitaxe` will call `git branch -D <branch>` on each of the branches you selected.

![gitaxe demo](./gitaxe.gif)
