import ProductMgr = require('dw/catalog/ProductMgr')
import HashMap = require('dw/util/HashMap');
import CatalogMgr = require('dw/catalog/CatalogMgr');
import Site = require('dw/system/Site');

CatalogMgr.getCatalog('test');
dw.catalog.CatalogMgr.getCatalog('test');

let a = new HashMap();
a.put('stringkey', 'stringvalue');
let result = a.somekey;

let cookies = request.httpCookies;
let keyed = cookies['keyed'];
let propname = cookies.propname;


let product = ProductMgr.getProduct('x');
let customattribute = product.custom.test;

let list: dw.util.List<dw.catalog.SortingOption> = dw.catalog.CatalogMgr.getSortingOptions();
list.toArray().forEach(element => {
  let displayname = element.displayName;
});
