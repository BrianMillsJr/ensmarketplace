/**
 * Value swappables are key values that can be swapped during compile time.
 * This library is useful for replacing values that are different in other networks.
 *
 * To configure a value swappable, simple place
 * "// DO NOT REMOVE -- value_swappable_with_key <key> <type>"
 * on top of the variables in your smart contracts.
 *
 * For example:
 * "// DO NOT REMOVE -- value_swappable_with_key TEST address"
 * address test = address(0x0);
 *
 * Where variable address test will be replaced with the value swappable TEST.
 *
 * Or, for example:
 *
 * "// DO NOT REMOVE -- value_swappable_with_key TEST bool"
 * address test = bool(true);
 */
module.exports = {
  homestead: {
    MAIN_REGISTRY: "",
  },
  rinkeby: {
    MAIN_REGISTRY: "",
  },
};
