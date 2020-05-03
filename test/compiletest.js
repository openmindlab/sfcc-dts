"use strict";
exports.__esModule = true;
var ProductMgr = require("dw/catalog/ProductMgr");
var HashMap = require("dw/util/HashMap");
var CatalogMgr = require("dw/catalog/CatalogMgr");
function getWithBasket(basket) {
    return true;
}
function methodWithList(test) {
    return true;
}
CatalogMgr.getCatalog('test');
dw.catalog.CatalogMgr.getCatalog('test');
var a = new HashMap();
a.put('stringkey', 'stringvalue');
var result = a.somekey;
var cookies = request.httpCookies;
var keyed = cookies['keyed'];
var propname = cookies.propname;
var product = ProductMgr.getProduct('x');
var customattribute = product.custom.test;
var list = dw.catalog.CatalogMgr.getSortingOptions();
list.toArray().forEach(function (element) {
    var displayname = element.displayName;
});
if (dw.system.System.getInstanceHostname() === dw.system.System.instanceHostname) {
    // it's ok
}
if (dw.system.Site.getCurrent() === dw.system.Site.current) {
    // it's ok
}
var parameterMap = request.getHttpParameterMap();
var paramvalue = parameterMap.orderID.stringValue;
var isPaypal = parameterMap.isPaypal.booleanValue;
var supermodule = module.superModule;
var order = dw.order.OrderMgr.getOrder("123");
var testifbasket = getWithBasket(order);
var pdict;
var testfrompdict = pdict.order.orderNumber;
var paypalForm = session.forms.billing.paypal;
var jsonexists = JSON.stringify(paypalForm);
var listIsArraylist;
methodWithList(listIsArraylist);
