#!/bin/sh
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

echo -e "This tool will invoke signer management in registry-manage-signer.js"; 
echo -e "Please follow the instructions to proceed.";
 
cd $DIR_PATH/utilities
RED='\033[0;31m'
NC='\033[0m' 
echo -e "${RED}Enter network:${NC}"; 
read network
echo "";
echo ".............................................................................................................................";
echo ".............................................................................................................................";
echo "";
echo -e "${RED}Enter signer address:${NC}"; 
read signerAddress
echo "";
echo ".............................................................................................................................";
echo ".............................................................................................................................";
echo "";
echo -e "${RED}Enable signer? (0) - false, (1) - true:${NC}"; 
read enableSigner

echo -e "Performing configuration...";

node registry-manage-signer.js $network $signerAddress $enableSigner