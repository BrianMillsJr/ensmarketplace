#!/bin/sh
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

git update-index --skip-worktree $DIR_PATH/truffle-config.js
git update-index --skip-worktree $DIR_PATH/resources/accounts.js
git update-index --skip-worktree $DIR_PATH/resources/signer.js

npm run dry_run
