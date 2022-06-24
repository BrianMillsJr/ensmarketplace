/**
 * This function replaces swappable values within the contracts. The swappable values are
 * indicated with a comment "DO NOT REMOVE -- value_swappable_with_key <key> <data_type>"
 *
 * i.e. DO NOT REMOVE -- value_swappable_with_key MAIN_REGISTRY address
 *
 * The function below will iterate through each line of a given file and replace values
 * where indicated with the key above.
 */
const fs = require("fs");
const { resolve } = require("path");
const { readdir } = require("fs").promises;
const swapValues = require("../resources/value-swappable");

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

getFiles(__dirname + "/../contracts")
  .then((files) => {
    return files;
  })
  .then((files) => {
    const network = process.argv[2];
    for (const f of files) {
      const data = fs.readFileSync(f, "utf-8");
      const dataLines = data.toString().split(/\r?\n/);
      let hasChanges = false;
      for (let i = 0; i < dataLines.length; i++) {
        if (dataLines[i].indexOf("value_swappable_with_key") > -1) {
          hasChanges = true;
          const swapAttributes = dataLines[i].split(
            "value_swappable_with_key "
          );
          const swapKey = swapAttributes[1].split(" ")[0];
          const swapType = swapAttributes[1].split(" ")[1];
          const swapValue = swapValues[network][swapKey];
          const swappableAttributes = dataLines[i + 1].split(" = ");
          const swappableKey = swappableAttributes[0];
          dataLines[i + 1] =
            swappableKey + " = " + swapType + "(" + swapValue + ");";
        }
      }
      if (hasChanges === true) {
        fs.writeFileSync(f, dataLines.join("\n"));
      }
    }
  })
  .catch((e) => {
    console.log(e);
    console.log("ERROR");
  });
