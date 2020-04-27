
import fs from "fs";
import path from "path";
import prettier from "prettier";
import jsonmergepatch from "json-merge-patch";
import propertiesReader from 'properties-reader';

const basePathGenerated = path.join(process.cwd(), "./@types", "sfcc");
const sfccApi: any = jsonmergepatch.apply(JSON.parse(fs.readFileSync("./api/sfcc-api.json", "utf8")), JSON.parse(fs.readFileSync("./api/patches.json", "utf8")));

var genericsremap = propertiesReader('./api/generics.properties');

const config: any = {
  typesMapping: {
    Number: "number",
    String: "string",
    Boolean: "boolean",
    Object: "any",
    arguments: "IArguments",
    Array: "Array"
  },
  generics: [
    "dw.util.Collection",
    "dw.util.List",
    "dw.util.ArrayList",
    "dw.util.FilteringCollection",
    "dw.util.Iterator",
    "dw.util.LinkedHashSet",
    "dw.util.Set",
    "dw.util.SortedSet",
    "dw.web.PagingModel",
    "Array"
  ],
  argsMapping: {
    function: "fn",
  },
  exclusions: {
    classes: ["Generator"],
    global: {
      constants: ["undefined"],
      properties: [],
      methods: [],
    },
  },
};

const isCollection = (fullclassname: string) => {
  return config.generics.includes(fullclassname);
}

const sanitizeType = (type: string, generics: string, isGeneric: boolean) => {
  var sanitizedType = (sfccApi.mapping[type] || type).replace("TopLevel.", "");
  let mapped = config.typesMapping[sanitizedType] || sanitizedType;
  if (generics) {
    return `${mapped}<${generics}>`
  }
  let result = isGeneric && mapped === 'any' ? 'T' : mapped;
  if (isGeneric && isCollection(result)) {
    return `${result}<T>`;
  }
  if (isCollection(result)) {
    return `${result}<any>`;
  }
  return result;
};

const sanitizeArg = (arg: string) => config.argsMapping[arg] || arg;


const objbToArray = (obj: any): any => {
  return Object.values(obj);
};

const sanitizeValue = (obj: any) => {
  switch (obj.class.name) {
    case "number":
    case "Number":
      try {
        return obj.value.match(/[0-9.]+/)[0];
      } catch (e) {
        console.log(obj.name);
      }
      break;
    default:
      return obj.value;
  }
};

const standardDefinition = (element: string): boolean => {
  if (element === 'Iterator') {
    return true;
  }
  try {
    eval(element);
    return true;
  } catch (e) {
    return false;
  }
};

const doc = (obj: any) => {
  if (!obj.description) {
    return '';
  }
  let description = obj.description;

  if (obj.args) {
    description += '\n' + obj.args.map((param: any) => `@param ${param.name} ${param.description}`).join("\n");
  }

  if (obj.class && obj.class.description) {
    description += `\n@return ${obj.class.description}`;
  }
  return `/**\n${description
    .split("\n")
    .map((line: string) => ` * ${line}`)
    .join("\n")}\n*/\n`;
};

const formatArgument = (arg: any, isGeneric: boolean) =>
  `${arg.multiple ? "..." : ""}${sanitizeArg(arg.name)}: ${sanitizeType(arg.class.name, arg.class.generics, isGeneric)}${arg.multiple ? "[]" : ""}`;

const filterComponent = (key: string, prop: string) => {
  return (element: any) =>
    (key === "global" && !standardDefinition(element.name)) ||
    (key !== "global" &&
      !(
        config.exclusions[key] &&
        config.exclusions[key][prop] &&
        config.exclusions[key][prop].includes(element.name)
      ));
};

const filterConstants = (key: string) => filterComponent(key, "constants");
const filterProperties = (key: string) => filterComponent(key, "properties");
const filterMethods = (key: string) => filterComponent(key, "methods");

const generateExportFileForClass = (theClass: any) => {
  var packageTokens = theClass.fullClassName.split(".");
  if (packageTokens.length && packageTokens[0] === "TopLevel") {
    packageTokens.shift();
  }
  var className = packageTokens.pop();

  var foldersPath = path.join.apply(
    null,
    [].concat(basePathGenerated, packageTokens)
  );

  fs.mkdirSync(foldersPath, {
    recursive: true,
  });

  var sourcePath = path.join(foldersPath, className + ".d.ts");
  fs.writeFileSync(
    sourcePath,
    `/// <reference path="${
    packageTokens.length == 0 ? "./" : packageTokens.map(() => "../").join("")
    }index.d.ts" />\nexport = ${theClass.fullClassName.replace(
      "TopLevel.",
      ""
    )};`
  );
};

const generateCodeForClass = (theClass: any) => {
  var source = "";
  var packageTokens = theClass.fullClassName.split(".");
  var isTopLevel = false;
  if (packageTokens.length && packageTokens[0] === "TopLevel") {
    isTopLevel = true;
    packageTokens.shift();
  }
  var className = packageTokens.pop();

  var isInterface = sfccApi.interfaces.includes(theClass.fullClassName);
  var isGlobal = className === "global";
  var isStatic = "static ";
  var readonly = "readonly ";
  if (isGlobal) {
    isStatic = "const ";
    readonly = "";
  }

  let isGeneric: boolean = config.generics.includes(theClass.fullClassName);

  if (!isGlobal) {
    if (theClass.description) {
      source += doc(theClass);
    }

    source += `${isTopLevel ? 'declare ' : ''}class ${className}${isGeneric ? '<T>' : ''} `;
    if (theClass.hierarchy.length > 1) {
      source += `extends ${sanitizeType(theClass.hierarchy.pop().name, null, isGeneric)} `;
    }
    source += "{\n";
  }

  source += objbToArray(theClass.constants)
    .filter(filterConstants(className))
    .reduce(
      (constantSource: any, constant: any) =>
        `${constantSource}${doc(constant)}${isGlobal ? 'declare ' : ''}${isStatic}${readonly}${
        constant.name
        }${!constant.value ? ": " + sanitizeType(constant.class.name, constant.class.generics, isGeneric && !isStatic) : ""}${
        constant.value ? " = " + sanitizeValue(constant) : ""
        };\n`,
      ""
    );
  source += "\n";

  source += objbToArray(theClass.properties)
    .filter(filterProperties(className))
    .reduce(
      (propSource: any, property: any) => {

        let returnType = sanitizeType(property.class.name, property.class.generics, isGeneric && !property.static);

        if (!isGeneric && returnType.indexOf('<any>') > -1) {

          let propkey = `${theClass.fullClassName}.get${property.name.charAt(0).toUpperCase()}${property.name.substring(1)}`;
          // @ts-ignore
          returnType = genericsremap.get(propkey) || returnType;

          if (returnType.indexOf('<any>') > -1) {
            console.log(`Unmapped generics: ${propkey}=${returnType}`);
          }
        }

        return `${propSource}${doc(property)}${isGlobal ? 'declare ' : ''}${property.static ? isStatic : ""}${
          property.readonly ? readonly : ""}${property.name}: ${returnType};\n`
      },
      ""
    );
  source += "\n";

  if (!isInterface) {
    source += objbToArray(theClass.constructors)
      .map((constructor: any) => {
        constructor.argsSource = constructor.args.map((m: any) => formatArgument(m, isGeneric)).join(", ");
        return constructor;
      })
      .reduce(
        (constructorSource: any, constructor: any) =>
          `${constructorSource}${doc(constructor)}constructor(${
          constructor.argsSource
          });\n`,
        ""
      );
    if (theClass.constructors.length === 0 && !isGlobal) {
      source += "private constructor();\n";
    }
    source += "\n";
  }

  source += objbToArray(theClass.methods)
    .filter(filterMethods(className))
    .map((method: any) => {
      method.argsSource = method.args.map((m: any) => formatArgument(m, isGeneric)).join(", ");
      return method;
    })
    .reduce(
      (methodSource: any, method: any) => {
        let returnType = sanitizeType(method.class.name, method.class.generics, isGeneric);

        if (!isGeneric && returnType.indexOf('<any>') > -1) {

          let propkey = `${theClass.fullClassName}.${method.name}`;
          // @ts-ignore
          returnType = genericsremap.get(propkey) || returnType;

          if (returnType.indexOf('<any>') > -1) {
            console.log(`Unmapped generics: ${propkey}=${returnType}`);
          }
        }

        return `${methodSource}${doc(method)}${isGlobal ? "declare function " : ""}${method.static && !isGlobal ? isStatic : ""
          }${method.name}(${method.argsSource}): ${returnType};\n`
      },
      ""
    );
  source += "\n";

  if (!isGlobal) {
    source += "}\n";
  }

  generateExportFileForClass(theClass);

  return source + "\n";
};

const generateCode = (pkg: any) =>
  Object.keys(pkg).reduce((source: string, key: string) => {
    if (!config.exclusions.classes[key] && !(pkg[key].package === 'TopLevel' && standardDefinition(key))) {
      if (pkg[key].fullClassName && !config.exclusions.classes[key]) {
        source += generateCodeForClass(pkg[key]) + "\n";
      } else {
        source += `
        namespace ${key} {\n`;
        source += generateCode(pkg[key]);
        source += `}\n`;
      }
    }
    return source;
  }, "");

var source = "";
//source += "declare global {\n";
source += generateCodeForClass(sfccApi.api.TopLevel.global);
delete sfccApi.api.TopLevel.global;
source += generateCode(sfccApi.api.TopLevel);
source += "declare namespace dw {\n";
source += generateCode(sfccApi.api.dw);
source += "}\n";
//source += "}\n";

let formatted = source;
try {
  formatted = prettier.format(source, { parser: "typescript" });
}
catch (e) {
  console.error(e);
}
fs.writeFileSync(
  path.join(basePathGenerated, "index.d.ts"),
  formatted
);
//
//   generateDts
//     .map((generateDtsPath) => `/// <reference path="${generateDtsPath}" />`)
//     .sort((a, b) => {
//       if (a === b) return 0;
//       if (a.indexOf("global") >= 0) return -1;
//       if (b.indexOf("global") >= 0) return 1;
//       if (a.indexOf("dw/") >= 0 && b.indexOf("dw") < 0) return 1;
//       if (a.indexOf("dw/") < 0 && b.indexOf("dw") >= 0) return -1;
//       return a.localeCompare(b);
//     })
//     .join("\n")
// );
//
