#!/usr/bin/env node
import { log } from 'console';
import fs from "fs";
import path from "path";
import pc from "picocolors";
import prompts from "prompts";
import { generateConstants } from './customtypes';

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
  let defaultdest = './cartridges/app_project/cartridge/scripts/';
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

  const destresponse = await prompts([
    {
      type: 'text',
      name: 'path',
      message: 'Folder for generated constant file?',
      initial: defaultdest,
      validate: value => !fs.existsSync(value) ? `Folder ${value} not found` : true
    }
  ]);
  let destination = path.join(destresponse.path, 'preferences.js');

  log(`Generating constants for organization and site preferences`);
  if (extensions) {
    await generateConstants(extensions, destination);
  }

  log(`\nDone!`);

})();