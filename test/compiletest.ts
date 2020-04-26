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





interface Collection<T> {
    [k: number]: T;
    add(T): void;
    empty: boolean;
}
