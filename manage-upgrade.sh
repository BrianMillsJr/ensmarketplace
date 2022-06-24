#!/bin/sh
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

echo -e "This tool produces upgrade signature that can be used in accounts.js"; 
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
echo -e "${RED}Choose upgrade type:${NC}"; 
echo -e "\t1. SWITCH_TIMELOCK";
echo -e "\t2. SWITCH_SIGNER - Add or remove signer.";
echo -e "\t3. SET_FACTORY - Set new factory contract address.";
echo -e "\t4. CANCEL_QUEUED_UPGRADE";
read upgradeType
echo "";
echo ".............................................................................................................................";
echo ".............................................................................................................................";
echo "";
if [ "$upgradeType" == "1" ]
then
  echo "Enter new time lock...";
  read input
  node sign-upgrade.js $network $upgradeType $input
fi 
if [ $upgradeType == "2" ] 
then
  echo "Enter signer address...";
  read input
  echo "Enter signer status... (1 - enable, 0 - disable)";
  read input2
  node sign-upgrade.js $network $upgradeType $input $input2
fi 
if [ $upgradeType == "3" ] 
then
  echo "Enter new factory address...";
  read input
  node sign-upgrade.js $network $upgradeType $input
fi 
if [ $upgradeType == "4" ] 
then
  echo -e "${RED}Select an upgrade to cancel:${NC}";
  echo -e "\t1. SWITCH_TIMELOCK";
  echo -e "\t2. SET_FACTORY - Set new factory contract address.";
  read input
  node sign-upgrade.js $network $upgradeType $input
fi 