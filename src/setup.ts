#!/usr/bin/env node
import path from "path";
import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import { execSync } from "child_process";
import { log } from 'console';

import { parse, stringify } from 'comment-json';


(async () => {

  const banner = chalk`
                _|_|                                        _|    _|                
    _|_|_|    _|        _|_|_|    _|_|_|                _|_|_|  _|_|_|_|    _|_|_|  
  _|_|      _|_|_|_|  _|        _|        _|_|_|_|_|  _|    _|    _|      _|_|      
      _|_|    _|      _|        _|                    _|    _|    _|          _|_|  
  _|_|_|      _|        _|_|_|    _|_|_|                _|_|_|      _|_|  _|_|_|    
                                                                                    
                                                                    `;
  log(chalk.hex('ed26f3')(banner));

  log(`Welcome to ${chalk.magentaBright('sfcc-dts')} interactive project setup wizard.\n`);
  const response = await prompts([{
    type: 'text',
    name: 'cartridgeroot',
    message: 'Directory containing your cartridges?',
    initial: './cartridges/',
    validate: value => !fs.existsSync(value) ? `Directory ${value} does not exists` : true
  }
    , {
    type: 'text',
    name: 'meta',
    message: 'Directory containing system-objecttype-extensions.xml?',
    initial: './sites/site_template/meta/',
    validate: value => !fs.existsSync(path.join(value, 'system-objecttype-extensions.xml')) ? `system-objecttype-extensions.xml not found in ${path.join(value, 'system-objecttype-extensions.xml')}` : true
  }
  ]);

  let cartridgeroot = response.cartridgeroot;
  let extensions = path.join(response.meta, 'system-objecttype-extensions.xml');
  log(`Ready to go, will setup the project using cartridges in ${cartridgeroot} and custom attributes definition in ${extensions}\n`);

  let tsconfig: any = {}
  if (fs.existsSync('tsconfig.json')) {
    log('Checking existing tsconfig.json');
    tsconfig = parse(fs.readFileSync('tsconfig.json', 'utf8'));
  } else {
    log('Creating new tsconfig.json');
  }

  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }

  if (!tsconfig.compilerOptions.plugins) {
    tsconfig.compilerOptions.plugins = [];
  }

  if (tsconfig.compilerOptions.plugins.filter((i: any) => i.name === 'sfcc-dts').length === 0) {
    log('Adding sfcc-dts typescript plugin');
    tsconfig.compilerOptions.plugins.push({ "name": "sfcc-dts" });
  }

  let requiredoptions: any = {
    "module": "commonjs",
    "target": "es5",
    "noEmit": false,
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "moduleResolution": "node"
  }

  Object.keys(requiredoptions).forEach(i => {
    if (tsconfig.compilerOptions.module !== 'commonjs') {
      log(`Setting compiler option ${i} to ${requiredoptions[i]}`);
      tsconfig.compilerOptions[i] = requiredoptions[i];
    }
  });

  if (!tsconfig.compilerOptions.paths) {
    tsconfig.compilerOptions.paths = {};
  }

  if (!tsconfig.compilerOptions.paths['dw/*'] || tsconfig.compilerOptions.paths['dw/*'].length !== 1 || tsconfig.compilerOptions.paths['dw/*'][0] !== "./node_modules/sfcc-dts/@types/sfcc/dw/*") {
    log(`Adding dw/* path`);
    tsconfig.compilerOptions.paths['dw/*'] = ["./node_modules/sfcc-dts/@types/sfcc/dw/*"];
  }
  if (!tsconfig.compilerOptions.paths['server'] || tsconfig.compilerOptions.paths['server'].length !== 1 || tsconfig.compilerOptions.paths['server'][0] !== `${cartridgeroot}/server`) {
    log(`Adding server path`);
    tsconfig.compilerOptions.paths['server'] = [`${path.join(cartridgeroot, 'server')}`];
  }

  let cartridges = fs.readdirSync(cartridgeroot).filter(i => fs.lstatSync(path.join(cartridgeroot, i)).isDirectory()).filter(i => fs.existsSync(path.join(path.join(cartridgeroot, i), 'cartridge')));
  log(`Adding cartridge path`);
  tsconfig.compilerOptions.paths['~/*'] = cartridges.map(i => `${path.join(cartridgeroot, i)}/*`);

  cartridges.forEach(i => {
    tsconfig.compilerOptions.paths[`${i}/*`] = [`${path.join(cartridgeroot, i)}/*`]
  });

  // removing deprecated _star_ path
  tsconfig.compilerOptions.paths['_star_/*'] = undefined;

  log(`Write tscconfig.json`);

  fs.writeFileSync('tsconfig.json', stringify(tsconfig, null, 2));

  let packagejson = parse(fs.readFileSync('package.json', 'utf8'));

  log(`Installing local copy of sfcc-dts`);

  execSync('npm install --save-dev sfcc-dts@latest typescript@latest', { stdio: 'inherit' });

  if ((packagejson.dependencies && packagejson.dependencies['dw-api']) || (packagejson.devDependencies && packagejson.devDependencies['dw-api'])) {
    log(`Uninstalling dw-api`);
    execSync('npm uninstall --save dw-api', { stdio: 'inherit' });
  }

  if (!fs.existsSync('@types')) {
    log(`Creating @types folder`);
    fs.mkdirSync('@types');
  }
  if (!fs.existsSync('@types/dw')) {
    log(`Creating @types/dw folder`);
    fs.mkdirSync(path.join('@types', 'dw'));
  }

  log(`Write @types/dw/index.d.ts`);
  fs.writeFileSync(path.join('@types/dw', 'index.d.ts'), '/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/index.d.ts" />\n');

  log(`\nDone!`);

})();