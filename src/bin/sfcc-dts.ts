import yargs from "yargs";

import attrs from "./lib/attrs";
import tsconfig from "./lib/tsconfig";

yargs
  .usage("")
  .command({
    command: "tsconfig [cartridgeSources...]",
    aliases: ["cfg"],
    describe: "Create a tsconfig.json file for your project.",
    builder: (yargs) =>
      yargs
        .positional("cartridgeSources", {
          default: ["cartridges"],
          description: ""
        })
        .options({
          cartrdigesPath: {
            required: true,
            alias: "cp",
            type: "string",
            description:
              "Cartrdige path as defined in Salesforce Commerce Cloud: cartridge1:cartridge2:...:cartridgeN",
          },
          modules: {
            required: true,
            alias: "m",
            type: "string",
            description:
              "Comma separated list of modules non included in cartridge path",
          },
        }),
    handler: (argv) => tsconfig,
  })
  .command({
    command: "tsconfig [cartridgeSources...]",
    aliases: ["cfg"],
    describe: "Create a tsconfig.json file for your project.",
    builder: (yargs) =>
      yargs
        .positional("cartridgeSources", {
          default: ["cartridges"],
          description: ""
        })
        .options({
          cartrdigesPath: {
            required: true,
            alias: "cp",
            type: "string",
            description:
              "Cartrdige path as defined in Salesforce Commerce Cloud: cartridge1:cartridge2:...:cartridgeN",
          },
          modules: {
            required: true,
            alias: "m",
            type: "string",
            description:
              "Comma separated list of modules non included in cartridge path",
          },
        }),
    handler: (argv) => attrs,
  });
