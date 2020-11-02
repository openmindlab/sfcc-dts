#!/usr/bin/env node
import path from "path";
import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import { execSync } from "child_process";
import { log } from 'console';
import { parse, stringify } from 'comment-json';
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
  const response = await prompts([
    {
      type: 'text',
      name: 'meta',
      message: 'Directory containing system-objecttype-extensions.xml?',
      initial: './sites/site_template/meta/',
      validate: value => !fs.existsSync(path.join(value, 'system-objecttype-extensions.xml')) ? `system-objecttype-extensions.xml not found in ${path.join(value, 'system-objecttype-extensions.xml')}` : true
    }
  ]);


  let extensions = path.join(response.meta, 'system-objecttype-extensions.xml');

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