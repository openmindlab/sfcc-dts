import fs from "fs";
import path from "path";
import prettier from "prettier";
import jsonmergepatch from "json-merge-patch";

const basePathGenerated = path.join(process.cwd(), "./@types", "sfcc");
const sfccApi: any = jsonmergepatch.apply(JSON.parse(fs.readFileSync("./api/sfcc-api.json", "utf8")), JSON.parse(fs.readFileSync("./api/patches.json", "utf8")));

const config: any = {
  typesMapping: {
    Number: "number",
    String: "string",
    Boolean: "boolean",
    Object: "any",
    arguments: "IArguments",
    Array: "Array<any>"
  },
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

const sanitizeType = (type: string) => {
  var sanitizedType = (sfccApi.mapping[type] || type).replace("TopLevel.", "");
  return config.typesMapping[sanitizedType] || sanitizedType;
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

const formatArgument = (arg: any) =>
  `${arg.multiple ? "..." : ""}${sanitizeArg(arg.name)}: ${sanitizeType(
    arg.class.name
  )}${arg.multiple ? "[]" : ""}`;

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

  if (!isGlobal) {
    if (theClass.description) {
      source += doc(theClass);
    }
    source += `${isTopLevel ? 'declare ' : ''}class ${className} `;
    if (theClass.hierarchy.length > 1) {
      source += `extends ${sanitizeType(theClass.hierarchy.pop().name)} `;
    }
    source += "{\n";
  }

  source += objbToArray(theClass.constants)
    .filter(filterConstants(className))
    .reduce(
      (constantSource: any, constant: any) =>
        `${constantSource}${doc(constant)}${isGlobal ? 'declare ' : ''}${isStatic}${readonly}${
        constant.name
        }${!constant.value ? ": " + sanitizeType(constant.class.name) : ""}${
        constant.value ? " = " + sanitizeValue(constant) : ""
        };\n`,
      ""
    );
  source += "\n";

  source += objbToArray(theClass.properties)
    .filter(filterProperties(className))
    .reduce(
      (propSource: any, property: any) =>
        `${propSource}${doc(property)}${isGlobal ? 'declare ' : ''}${property.static ? isStatic : ""}${
        property.readonly ? readonly : ""
        }${property.name}: ${sanitizeType(property.class.name)};\n`,
      ""
    );
  source += "\n";

  if (!isInterface) {
    source += objbToArray(theClass.constructors)
      .map((constructor: any) => {
        constructor.argsSource = constructor.args.map(formatArgument).join(", ");
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
      method.argsSource = method.args.map(formatArgument).join(", ");
      return method;
    })
    .reduce(
      (methodSource: any, method: any) =>
        `${methodSource}${doc(method)}${isGlobal ? "declare function " : ""}${
        method.static && !isGlobal ? isStatic : ""
        }${method.name}(${method.argsSource}): ${sanitizeType(
          method.class.name
        )};\n`,
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

fs.writeFileSync(
  path.join(basePathGenerated, "index.d.ts"),
  prettier.format(source, { parser: "typescript" })
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
