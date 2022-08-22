# Salesforce Commerce Cloud type definitions

> High quality Salesforce Commerce Cloud type definitions. A dw-api-types "done right"


## Features

`sfcc-dts` provides full typeScript definitions for Salesforce Commerce Cloud apis, plus a typescript plugin for resolving requires using "*" cartridge path and a fancy wizard for setting up your project.

The aim of the project is to provide *fully working typescript compilation of commerce cloud server side javascript*.

> Wait, why is this better than the official dw-api from salesforce?

Well, tons of reasons:
* dw-api definitions are largerly incomplete
* dw-api definitions are often wrongly defined in terms of static properties/methods
* dw-api are not documented. sfcc-dts has *full documentation for classes, methods, properties, parameters and return types*
* dw-api is not actively updated when new API gets released. Instead, sfcc-dts definitions are *automatically generated by parsing the public salesforce documentation*, so they can easily be kept up to date

## Installation

Using the wizard:

```bash
$ npm i -g sfcc-dts
```

From your sfcc project root directory type:

```bash
$ sfcc-dts-setup
```

The wizard will guide you for adding required dependencies to `package.json`, setup a working `tsconfig.json` and configure a customizable dw types entry point for your project.

## VSCode setup

Vscode will fully benefit from the typescript configuration from `tsconfig.json` only when is configured for using the workspace version of typescript.

For enabling it press [cmd]+[shift]+P -> "TypeScript: Select TypeScript version" and select "Use workspace version" with the version pointing to the node_modules/typescript dir in the workspace.

<img width="641" src="https://raw.githubusercontent.com/openmindlab/sfcc-dts/HEAD/media/vscode-select.png" alt="vscode selection of typescript version">

If the "TypeScript: Select TypeScript version" option or the expected directory dooesn't show up, just open the node_modules/typescript/bin/tsc file inside vscode and retry, this is usually enough to make vscode detect the available typescript installation.

## Type definitions for custom attributes

sfcc-dts can generate definitions for project-specific system object extensions by parsing a `system-objecttype-extensions.xml` file.

Custom attribute definitions are automatically generated by the `sfcc-dts-setup` wizard, assuming a `system-objecttype-extensions.xml` file is available (the default location is `sites/site_template/meta/system-objecttype-extensions.xml` 
but the wizard will allow you to choose a different path) and saved to `@types/dw/attrs.d.ts`.

Definitions can be updated by running `sfcc-dts-updateattrs`

## Usage

If everything goes well you will see autocomplete and validation working in your existing javascript files. Typescript will fully detect:
* requires using `dw/system/Site` syntax
* cartridge requires using `*/cartridge/somefile` or `~/cartridge/somefile`
* fully qualified class names such as `dw.system.Site`
* dw globals such as `request`

<img width="730" src="https://raw.githubusercontent.com/openmindlab/sfcc-dts/HEAD/media/vscode-autocomplete.png" alt="vscode example ofworking setup">

## Todo

Still in the checklist:
* Find a proper way to define module.superModule augmenting the standard NodeModule definition

## License

Released under the MIT license.
