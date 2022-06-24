#!/bin/sh
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

echo -e "This tool will invoke signer management in registry-change-timelock.js"; 
echo -e "Please follow the instructions to proceed.";
 
cd $DIR_PATH/utilities
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
echo -e "${RED}Enter network:${NC}"; 
read network
echo "";
echo ".............................................................................................................................";
echo ".............................................................................................................................";
echo "";
echo -e "${GREEN}Note:${NC} timelock is based on blocks - how many blocks since new upgrades have been can it be executed.";
echo -e "${RED}Enter new timelock duration (number of blocks):${NC}"; 
read timelock

echo -e "Performing configuration...";

node registry-change-timelock.js $network $timelock