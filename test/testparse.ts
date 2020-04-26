import fs from "fs";
import cheerio from "cheerio";


let $ = cheerio.load(fs.readFileSync('test/samples/method.html', 'utf8'));

let el = $(':root').find(".detailItem");

console.log(`Parsing method of class ${$(el).find(".detailName").text().trim()}`);

let detailSignature = $(el).find('.detailSignature').text().trim();
let parsedPropertyText = /^(?:\n|\s)*(static)?(?:\n|\s)*([^\s\t]+)\(([^\)]*)\)(?:\n|\t|\s|:)*([^\s\t]+)/.exec(
  detailSignature
);

let staticprefix = parsedPropertyText[1];
let methodname = parsedPropertyText[2];
let params = parsedPropertyText[3];
let returnValue = parsedPropertyText[4];
let returnDesc = $(el).find(".parameters").filter(
  (i, el) =>
    $(el).find(".parameterTitle").text().indexOf("Returns:") >= 0
).find('.parameterDesc').text().trim();

let paramsDoc = $(el).find(".parameters").filter((i, el) => $(el).find(".parameterTitle").text().indexOf("Parameters:") >= 0).find('.parameterDetail');

console.log('name');
console.log($(el).find(".detailName").text().trim());
console.log('\n');

console.log('description');
console.log($(el).find(".description").text().trim());
console.log('\n');

console.log('deprecated');
console.log(!!$(el).find(".dep").length);
console.log('\n');

console.log('static');
console.log(staticprefix.indexOf('static') == 0);
console.log('\n');

console.log('returnValue: ' + returnValue);
console.log('returnDesc: ' + returnDesc);


let args = params.split(",").filter(arg => arg && arg.trim().length).map((arg) => {
  let argTouple = arg.split(":");
  let argType = argTouple[1].trim().split('...');
  let argName = argTouple[0].trim();
  return {
    name: argName,
    description: paramsDoc.filter((i, el) => $(el).find(".parameterName").text().trim() == argName).find('.parameterDesc').text().trim(),
    class: {
      name: argType[0].trim(),
    },
    multiple: argType.length > 1
  };
})

console.log('params: ' + JSON.stringify(args, null, 2));

