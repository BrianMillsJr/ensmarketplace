#!/bin/sh
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

git update-index --no-skip-worktree $DIR_PATH/truffle-config.js
git update-index --no-skip-worktree $DIR_PATH/resources/accounts.js 
git update-index --no-skip-worktree $DIR_PATH/resources/signer.js 
git update-index --no-skip-worktree $DIR_PATH/utilities/tests/test-accounts.js