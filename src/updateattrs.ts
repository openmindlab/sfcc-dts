#!/usr/bin/env node
import chalk from "chalk";
import { log } from 'console';
import fs from "fs";
import path from "path";
import prompts from "prompts";
import { generateCustomTypes } from './customtypes';

(async () => {

  const banner = chalk`
                _|_|                                        _|    _|                
    _|_|_|    _|        _|_|_|    _|_|_|                _|_|_|  _|_|_|_|    _|_|_|  
  _|_|      _|_|_|_|  _|        _|        _|_|_|_|_|  _|    _|    _|      _|_|      
      _|_|    _|      _|        _|                    _|    _|    _|          _|_|  
  _|_|_|      _|        _|_|_|    _|_|_|                _|_|_|      _|_|  _|_|_|    
                                                                                    
                                                                    `;
  log(chalk.hex('ed26f3')(banner));

  log(`Welcome to ${chalk.magentaBright('sfcc-dts')} custom attributes definition generator.\n`);

  let defaultpath = './sites/site_template/meta/';
  let extensions;

  if (fs.existsSync(path.join(defaultpath, 'system-objecttype-extensions.xml'))) {
    log(`system-objecttype-extensions.xml detected at ${defaultpath}`);
    extensions = path.join(defaultpath, 'system-objecttype-extensions.xml');
  }
  else {

    const response = await prompts([
      {
        type: 'text',
        name: 'meta',
        message: 'Directory containing system-objecttype-extensions.xml?',
        initial: defaultpath,
        validate: value => !fs.existsSync(path.join(value, 'system-objecttype-extensions.xml')) ? `system-objecttype-extensions.xml not found in ${path.join(value, 'system-objecttype-extensions.xml')}` : true
      }
    ]);
    extensions = path.join(response.meta, 'system-objecttype-extensions.xml');
  }

  log(`Generating definitions for custom attributes`);
  if (extensions) {
    await generateCustomTypes(extensions);
  }

  log(`Write @types/dw/index.d.ts`);
  let references = '/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/index.d.ts" />\n';
  if (extensions) {
    references += '/// <reference path="./attrs.d.ts" />\n';
  }
  else {
    references += '/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/attrs.d.ts" />\n';
  }

  fs.writeFileSync(path.join('@types/dw', 'index.d.ts'), references);

  log(`\nDone!`);

})();