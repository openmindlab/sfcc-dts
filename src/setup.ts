#!/usr/bin/env node
import arg from 'arg';
import { execSync } from "child_process";
import { parse, stringify } from 'comment-json';
import { log } from 'console';
import fs from "fs";
import path from "path";
import pc from "picocolors";
import prompts from "prompts";
import { generateCustomTypes } from './customtypes';

(async () => {

  const banner = `
                _|_|                                        _|    _|                
    _|_|_|    _|        _|_|_|    _|_|_|                _|_|_|  _|_|_|_|    _|_|_|  
  _|_|      _|_|_|_|  _|        _|        _|_|_|_|_|  _|    _|    _|      _|_|      
      _|_|    _|      _|        _|                    _|    _|    _|          _|_|  
  _|_|_|      _|        _|_|_|    _|_|_|                _|_|_|      _|_|  _|_|_|    
                                                                                    
                                                                    `;
  log(pc.magenta(banner));

  const args = arg({
    '--cartridgePath': String,
    '--metaPath': String,
    '--attrsOutputPath': String
  });

  log(`Welcome to ${pc.magenta('sfcc-dts')} interactive project setup wizard.\n`);
  let cartridgeroot = args['--cartridgePath'];
  let extensions = args['--metaPath'];
  const outpath = args['--attrsOutputPath'] || '@types/dw';

  if (!cartridgeroot || !fs.existsSync(cartridgeroot)) {
    const response = await prompts({
      type: 'text',
      name: 'cartridgeroot',
      message: 'Directory containing your cartridges?',
      initial: './cartridges/',
      validate: value => !fs.existsSync(value) ? `Directory ${value} does not exists` : true
    });
    cartridgeroot = response.cartridgeroot;
  }
  if (!extensions || !fs.existsSync(extensions)) {
    const response = await prompts({
      type: 'text',
          name: 'meta',
        message: 'Directory containing system-objecttype-extensions.xml?',
        initial: './sites/site_template/meta/',
        validate: value => !fs.existsSync(value) ? `directory ${value} not found` : true
    });
    extensions = response.meta;
  }
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
  if (!tsconfig.compilerOptions.paths['server'] || tsconfig.compilerOptions.paths['server'].length !== 1 || tsconfig.compilerOptions.paths['server'][0] !== `${cartridgeroot}/modules/server`) {
    log(`Adding server path`);
    tsconfig.compilerOptions.paths['server'] = [`${path.join(cartridgeroot, 'modules/server')}`];
    tsconfig.compilerOptions.paths['server/*'] = [`${path.join(cartridgeroot, 'modules/server/*')}`];
  }

  let cartridges = fs.readdirSync(cartridgeroot).filter(i => fs.lstatSync(path.join(cartridgeroot, i)).isDirectory() || fs.lstatSync(path.join(cartridgeroot, i)).isSymbolicLink()).filter(i => fs.existsSync(path.join(path.join(cartridgeroot, i), 'cartridge')));
  log(`Adding cartridge path`);
  tsconfig.compilerOptions.paths['~/*'] = cartridges.map(i => `${path.join(cartridgeroot, i)}/*`);

  cartridges.forEach(i => {
    tsconfig.compilerOptions.paths[`${i}/*`] = [`${path.join(cartridgeroot, i)}/*`]
  });

  // removing deprecated _star_ path
  tsconfig.compilerOptions.paths['_star_/*'] = undefined;

  log(`Write tscconfig.json`);

  fs.writeFileSync('tsconfig.json', stringify(tsconfig, null, 2));

  let packagejson : any = parse(fs.readFileSync('package.json', 'utf8'));

  if (!packagejson.devDependencies || !packagejson.devDependencies['sfcc-dts']) {
    log(`Installing local copy of sfcc-dts`);

    execSync('npm install --save-dev sfcc-dts@latest typescript@latest', { stdio: 'inherit' });
  }

  if ((packagejson.dependencies && packagejson.dependencies['dw-api']) || (packagejson.devDependencies && packagejson.devDependencies['dw-api'])) {
    log(`Uninstalling dw-api`);
    execSync('npm uninstall --save dw-api', { stdio: 'inherit' });
  }

  if (!fs.existsSync(outpath)) {
    log(`Creating ${outpath} folder`);
    fs.mkdirSync(outpath, {recursive: true});
  }

  log(`Generating definitions for custom attributes`);
  if (extensions) {
    await generateCustomTypes(extensions, outpath);
  }

  log(`Write ${outpath}/index.d.ts`);
  let references = '/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/index.d.ts" />\n';
  if (extensions) {
    references += '/// <reference path="./attrs.d.ts" />\n';
  }
  else {
    references += '/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/attrs.d.ts" />\n';
  }

  fs.writeFileSync(path.join(outpath, 'index.d.ts'), references);

  log(`\nDone!`);

})();