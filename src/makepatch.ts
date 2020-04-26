
import jsonmergepatch from "json-merge-patch";
import fs from 'fs';


if (!fs.existsSync("./api/sfcc-api.json")) {
  console.log('Make api patches - get original definition using scrape first');
}
else if (!fs.existsSync("./api/sfcc-api-patched.json")) {
  const patched = jsonmergepatch.apply(JSON.parse(fs.readFileSync("./api/sfcc-api.json", "utf8")), JSON.parse(fs.readFileSync("./api/patches.json", "utf8")));
  fs.writeFileSync('./api/sfcc-api-patched.json', JSON.stringify(patched, null, 2));
  console.log('Make api patches - apply your modifications to api/sfcc-api-patched.json and run again to generate a patch file');
}
else {
  console.log('Make api patches - generating patches file to api/patches.json');

  var patches = jsonmergepatch.generate(
    JSON.parse(fs.readFileSync("./api/sfcc-api.json", "utf8")),
    JSON.parse(fs.readFileSync("./api/sfcc-api-patched.json", "utf8"))
  );
  fs.writeFileSync('./api/patches.json', JSON.stringify(patches, null, 2));
}