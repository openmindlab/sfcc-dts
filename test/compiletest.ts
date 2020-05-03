import ProductMgr = require('dw/catalog/ProductMgr')
import HashMap = require('dw/util/HashMap');
import CatalogMgr = require('dw/catalog/CatalogMgr');
import Site = require('dw/system/Site');



function getWithBasket(basket : dw.order.LineItemCtnr) : boolean {
  return true;
}

function methodWithList(test: dw.util.List<dw.value.Money>) {
  return true;
}

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

if (dw.system.System.getInstanceHostname() === dw.system.System.instanceHostname) {
  // it's ok
}

if (dw.system.Site.getCurrent() === dw.system.Site.current) {
  // it's ok
}

var parameterMap: dw.web.HttpParameterMap = request.getHttpParameterMap();
let paramvalue = parameterMap.orderID.stringValue;
var isPaypal = parameterMap.isPaypal.booleanValue;

let supermodule = module.superModule;

let order = dw.order.OrderMgr.getOrder("123");
let testifbasket = getWithBasket(order);

let pdict : dw.system.PipelineDictionary;
let testfrompdict = pdict.order.orderNumber;

var paypalForm = session.forms.billing.paypal;

let jsonexists = JSON.stringify(paypalForm);

let listIsArraylist: dw.util.ArrayList<dw.value.Money>;
methodWithList(listIsArraylist);

Object.keys(paypalForm).forEach(function (routeName) {
  // does Object.keys() exists?
});

let somebind = function (route) {
  route.chain.unshift.apply(route.chain, this.get());
}.bind(this);
