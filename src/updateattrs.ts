#!/usr/bin/env node
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

  log(`Welcome to ${pc.magenta('sfcc-dts')} custom attributes definition generator.\n`);

  let defaultpath = './sites/site_template/meta/';
  let extensionspath;

  if (fs.existsSync(defaultpath)) {
    log(`directory ${defaultpath} available`);
    extensionspath = defaultpath;
  }
  else {

    const response = await prompts([
      {
        type: 'text',
        name: 'meta',
        message: 'Directory containing system-objecttype-extensions.xml?',
        initial: defaultpath,
        validate: value => !fs.existsSync(value) ? `directory ${value} not found` : true
      }
    ]);
    extensionspath = response.meta;
  }

  log(`Generating definitions for custom attributes`);
  if (extensionspath) {
    await generateCustomTypes(extensionspath);
  }

  log(`Write @types/dw/index.d.ts`);
  let references = '/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/index.d.ts" />\n';
  if (extensionspath) {
    references += '/// <reference path="./attrs.d.ts" />\n';
  }
  else {
    references += '/// <reference path="../../node_modules/sfcc-dts/@types/sfcc/attrs.d.ts" />\n';
  }

  fs.writeFileSync(path.join('@types/dw', 'index.d.ts'), references);

  log(`\nDone!`);

})();