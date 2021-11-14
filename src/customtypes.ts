#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import path from "path";
import prettier from "prettier";
import xml2js from 'xml2js';

interface Attributedefinition {
  attributeid: string;
  displayname: any;
  type: string;
  mandatoryflag: string;
  externallymanagedflag: string;
  description: string;
  minlength: string;
  localizableflag: string;
  fieldlength: string;
  fieldheight: string;
  valuedefinitions: [{ value: string }];
  sitespecificflag: string;
  defaultvalue: string;
  visibleflag: string;
  orderrequiredflag: string;
  externallydefinedflag: string;
  minvalue: string;
  maxvalue: string;
}

interface AttributeId {
  attributeid: string;
}

interface Groupdefinition {
  groupid: string;
  displayname: string;
  attribute: AttributeId[];
}

interface ObjectTypeExtensions {
  typeid: string;
  attributedefinitions: Attributedefinition[];
  groupdefinitions: {
    attributegroup: Groupdefinition[];
  }
}




export async function generateCustomTypes(extensionsfolder: string) {

  let typeExtensions: ObjectTypeExtensions[] = [];
  let folder = fs.readdirSync(extensionsfolder).filter(i => !fs.lstatSync(path.join(extensionsfolder, i)).isDirectory() && i.endsWith('.xml'));
  for (let j = 0; j < folder.length; j++) {
    let extensions = path.join(extensionsfolder, folder[j]);
    typeExtensions = typeExtensions.concat(await parseMeta(extensions));
  }

  typeExtensions = typeExtensions.filter(te => te.typeid && te.attributedefinitions && te.attributedefinitions.length > 0).sort((a, b) => a.typeid.localeCompare(b.typeid));

  let uniquetypes: any = {};
  typeExtensions.forEach(ts => {
    if (!uniquetypes[ts.typeid]) {
      uniquetypes[ts.typeid] = ts;
    } else {
      uniquetypes[ts.typeid].attributedefinitions = uniquetypes[ts.typeid].attributedefinitions.concat(ts.attributedefinitions);
    }
  });

  let attrspath = path.join(__dirname, '../@types/sfcc/attrs.txt');
  console.log('path is ' + attrspath);
  let customObjList = new Set(fs.readFileSync(attrspath, 'utf8').split('\n'));

  let customattrsrc = Object.keys(uniquetypes).map((k: string) => {
    let i: ObjectTypeExtensions = uniquetypes[k];
    let typename = i.typeid;
    customObjList.delete(typename);

    i.attributedefinitions = i.attributedefinitions.sort((a, b) => a.attributeid.localeCompare(b.attributeid));
    return `
/**
 * Custom attributes for ${typename} object.
 */
declare class ${typename}CustomAttributes {

  ${i.attributedefinitions.map(at => mapAttribute(at)).join('\n')}
}`
  }).join('\n');



  customattrsrc += Array.from(customObjList).map((typename: string) => {
    return `
/**
 * Custom attributes for ${typename} object.
 */
declare class ${typename}CustomAttributes {
  /**
   * Returns the custom attribute with this name. Throws an exception if attribute is not defined
   */
  [name: string]: any;
}`
  }).join('\n');


  let out = customattrsrc;
  let outpath = path.join('@types/dw', "attrs.d.ts");

  let prettierconfig = {} as any;
  if (fs.existsSync('.prettierrc')) {
    try {
      prettierconfig = JSON.parse(fs.readFileSync('.prettierrc', 'utf8'));
    } catch (e) {
      console.log(chalk.red(`Unable to parse local .prettierrc: ${e}`));
    }
  }

  prettierconfig.parser = "typescript";
  prettierconfig.proseWrap = 'always';

  try {
    out = prettier.format(customattrsrc, prettierconfig)
  } catch (e) {
    console.error(chalk.red(`Prettier format failed, check generated file at ${outpath}\n${e}`));
  }

  fs.writeFileSync(outpath, out);
}


function attributeConstant(at: AttributeId) {

  return `${at.attributeid} : '${at.attributeid}'
 `;
}



export async function generateConstants(extensions: string, dest: string) {
  let typeExtensions: ObjectTypeExtensions[] = await parseMeta(extensions);


  let customattrsrc = Array.from(typeExtensions).filter(i => i.attributedefinitions && i.attributedefinitions.length > 0)
    .filter((i: ObjectTypeExtensions) => i.typeid == 'OrganizationPreferences')
    .map((i: ObjectTypeExtensions) => {
      return `
/**
 * Organization preferences.
 */
const organization = {

  ${i.groupdefinitions.attributegroup.map(gd => {
        return `
    ${toConstant(gd.groupid)} : {
      ${ensureArray(gd, 'attribute') && gd.attribute.map(a => attributeConstant(a))}
    }`
      })}
}`
    }).join('\n');


  customattrsrc += Array.from(typeExtensions).filter(i => i.attributedefinitions && i.attributedefinitions.length > 0)
    .filter((i: ObjectTypeExtensions) => i.typeid == 'SitePreferences')
    .map((i: ObjectTypeExtensions) => {
      return `
/**
 * Site preferences.
 */
const site = {

  ${i.groupdefinitions.attributegroup.map(gd => {
        return `
    ${toConstant(gd.groupid)} : {
      ${ensureArray(gd, 'attribute') && gd.attribute.map(a => attributeConstant(a))}
    }`
      })}
}`
    }).join('\n');

  customattrsrc += `
  module.exports = {
    organization: organization,
    site: site,
  };
  `;

  let prettierconfig = {} as any;
  if (fs.existsSync('.prettierrc')) {
    try {
      prettierconfig = JSON.parse(fs.readFileSync('.prettierrc', 'utf8'));
    } catch (e) {
      console.log(chalk.red(`Unable to parse local .prettierrc: ${e}`));
    }
  }

  prettierconfig.parser = "babel";
  prettierconfig.proseWrap = 'always';

  let out = customattrsrc;
  try {
    out = prettier.format(customattrsrc, prettierconfig)
  } catch (e) {
    console.error(chalk.red(`Prettier format failed, check generated file at ${dest}\n${e}`));
  }

  fs.writeFileSync(dest, out);
}


function toConstant(val: string) {
  return val.replace(/ /g, '_').replace(/[- \( \)]/g, '_');
}

function mapAttribute(at: Attributedefinition) {

  return `/**
  * ${at.description || at.displayname || ''}
  */
 ${at.attributeid.indexOf('-') > -1 ? "'" + at.attributeid + "'" : at.attributeid}: ${remapType(at)};

 `;
}

function remapType(at: Attributedefinition): string {
  if (at.type === 'string' || at.type === 'text' || at.type === 'password' || at.type === 'email') {
    return 'string';
  }

  if (at.type === 'double' || at.type === 'int') {
    return 'number';
  }

  if (at.type === 'set-of-string') {
    return 'string[]';
  }

  if (at.type === 'set-of-int') {
    return 'number[]';
  }

  if (at.type === 'date' || at.type === 'datetime') {
    return 'Date';
  }

  if (at.type === 'enum-of-int' || at.type === 'enum-of-double') {
    return (at.valuedefinitions || [{ value: 0 } as any]).map(v => v.value).join(' | ');
  }

  if (at.type === 'enum-of-string') {
    return (at.valuedefinitions || [{ value: '' } as any]).map(v => `'${v.value}'`).join(' | ');
  }


  if (at.type === 'image') {
    return 'dw.content.MediaFile';
  }

  if (at.type === 'html') {
    return 'dw.content.MarkupText';
  }

  return at.type;
}


async function parseMeta(source: string): Promise<ObjectTypeExtensions[]> {
  var parser = new xml2js.Parser({
    trim: true,
    normalizeTags: true,
    mergeAttrs: true,
    explicitArray: false,
    attrNameProcessors: [function (name: string) { return name.replace(/-/g, ''); }],
    tagNameProcessors: [function (name: string) { return name.replace(/-/g, ''); }]
  });
  let exts = await parser.parseStringPromise(fs.readFileSync(source, 'utf-8'),);

  if (exts.metadata && exts.metadata.typeextension) {
    ensureArray(exts.metadata, 'typeextension');
    exts = exts.metadata.typeextension.map((i: any) => cleanupEntry(i)).filter((i: any) => i.attributedefinitions);
  }

  cleanI18n(exts);

  // fs.writeFileSync(path.join(process.cwd(), `${path.basename(source)}.json`), JSON.stringify(exts, null, 2));

  return exts as ObjectTypeExtensions[];
}


function ensureArray(object: any, field: string) {
  if (object && object[field] && !object[field].length) {
    object[field] = [object[field]];
  }
  return true;
}

function cleanupEntry(i: any) {
  let res = i;

  // normalize
  if (res.customattributedefinitions) {
    res.attributedefinitions = res.customattributedefinitions;
    delete res.customattributedefinitions;
  }
  delete res.systemattributedefinitions;
  // cleanup single attributes without array
  if (res.attributedefinitions && res.attributedefinitions.attributedefinition && res.attributedefinitions.attributedefinition.attributeid) {
    res.attributedefinitions.attributedefinition = [res.attributedefinitions.attributedefinition];
  }
  if (res.attributedefinitions && res.attributedefinitions.attributedefinition) {
    res.attributedefinitions = res.attributedefinitions.attributedefinition;

    res.attributedefinitions.forEach((ad: any) => {
      if (ad.valuedefinitions) {
        ad.valuedefinitions = ad.valuedefinitions.valuedefinition;
        ensureArray(ad, 'valuedefinitions');
      }
    });
    if (res.attributedefinitions.valuedefinitions) {

    }
  }
  return res;
}


function cleanI18n(obj: any) {
  Object
    .entries(obj)
    .forEach(entry => {
      let [k, v]: any = entry
      if (v !== null && typeof v === 'object' && !v.escape) {
        if (v._ && v['xml:lang'] && Object.keys(v).length === 2) {
          obj[k] = v._;
          // log(`-> replaced ${obj[k]}`);
        }
        cleanI18n(v);
      }
    })
}
