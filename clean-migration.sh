#!/bin/sh
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

git update-index --skip-worktree $DIR_PATH/truffle-config.js
git update-index --skip-worktree $DIR_PATH/resources/accounts.js
git update-index --skip-worktree $DIR_PATH/resources/signer.js
cd $DIR_PATH

if [[  $1 == "" ]]; then
    echo "-----------------------------------------------------------------------------------------";
    echo -e "\033[0;31mNetwork ID (kovan, ropsten, &c.) must be given on the first parameter.\033[0m";
    echo "-----------------------------------------------------------------------------------------";
    exit;
fi

npm run clean_test_migration $1
