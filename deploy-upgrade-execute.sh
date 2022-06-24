#!/bin/sh
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

if [[  $1 == "" ]]; then
    echo "-----------------------------------------------------------------------------------------";
    echo -e "\033[0;31mNetwork ID (kovan, ropsten, &c.) must be given on the first parameter.\033[0m";
    echo "-----------------------------------------------------------------------------------------";
    exit;
fi
cd $DIR_PATH
swapResult=$(node $DIR_PATH/utilities/commit-value-swappable.js $1)
if [[ $swapResult == "ERROR" ]]; then
    echo "An error has occured during value swap. Check your contract swappable variables."
    exit
fi
npm run upgrade_execute $1
