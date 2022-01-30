/**
 * Template7 1.4.2
 * Mobile-first HTML template engine
 * 
 * http://www.idangero.us/template7/
 * 
 * Copyright 2019, Vladimir Kharlampidi
 * The iDangero.us
 * http://www.idangero.us/
 * 
 * Licensed under MIT
 * 
 * Released on: June 14, 2019
 */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).Template7=t()}(this,function(){"use strict";var t7ctx;t7ctx="undefined"!=typeof window?window:"undefined"!=typeof global?global:void 0;var Template7Context=t7ctx,Template7Utils={quoteSingleRexExp:new RegExp("'","g"),quoteDoubleRexExp:new RegExp('"',"g"),isFunction:function(e){return"function"==typeof e},escape:function(e){return void 0===e&&(e=""),e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")},helperToSlices:function(e){var t,r,i,n=Template7Utils.quoteDoubleRexExp,l=Template7Utils.quoteSingleRexExp,a=e.replace(/[{}#}]/g,"").trim().split(" "),s=[];for(r=0;r<a.length;r+=1){var o=a[r],p=void 0,c=void 0;if(0===r)s.push(o);else if(0===o.indexOf('"')||0===o.indexOf("'"))if(p=0===o.indexOf('"')?n:l,c=0===o.indexOf('"')?'"':"'",2===o.match(p).length)s.push(o);else{for(t=0,i=r+1;i<a.length;i+=1)if(o+=" "+a[i],0<=a[i].indexOf(c)){t=i,s.push(o);break}t&&(r=t)}else if(0<o.indexOf("=")){var u=o.split("="),f=u[0],d=u[1];if(p||(p=0===d.indexOf('"')?n:l,c=0===d.indexOf('"')?'"':"'"),2!==d.match(p).length){for(t=0,i=r+1;i<a.length;i+=1)if(d+=" "+a[i],0<=a[i].indexOf(c)){t=i;break}t&&(r=t)}var m=[f,d.replace(p,"")];s.push(m)}else s.push(o)}return s},stringToBlocks:function(e){var t,r,i=[];if(!e)return[];var n=e.split(/({{[^{^}]*}})/);for(t=0;t<n.length;t+=1){var l=n[t];if(""!==l)if(l.indexOf("{{")<0)i.push({type:"plain",content:l});else{if(0<=l.indexOf("{/"))continue;if((l=l.replace(/{{([#/])*([ ])*/,"{{$1").replace(/([ ])*}}/,"}}")).indexOf("{#")<0&&l.indexOf(" ")<0&&l.indexOf("else")<0){i.push({type:"variable",contextName:l.replace(/[{}]/g,"")});continue}var a=Template7Utils.helperToSlices(l),s=a[0],o=">"===s,p=[],c={};for(r=1;r<a.length;r+=1){var u=a[r];Array.isArray(u)?c[u[0]]="false"!==u[1]&&u[1]:p.push(u)}if(0<=l.indexOf("{#")){var f="",d="",m=0,h=void 0,g=!1,x=!1,v=0;for(r=t+1;r<n.length;r+=1)if(0<=n[r].indexOf("{{#")&&(v+=1),0<=n[r].indexOf("{{/")&&(v-=1),0<=n[r].indexOf("{{#"+s))f+=n[r],x&&(d+=n[r]),m+=1;else if(0<=n[r].indexOf("{{/"+s)){if(!(0<m)){h=r,g=!0;break}m-=1,f+=n[r],x&&(d+=n[r])}else 0<=n[r].indexOf("else")&&0===v?x=!0:(x||(f+=n[r]),x&&(d+=n[r]));g&&(h&&(t=h),"raw"===s?i.push({type:"plain",content:f}):i.push({type:"helper",helperName:s,contextName:p,content:f,inverseContent:d,hash:c}))}else 0<l.indexOf(" ")&&(o&&(s="_partial",p[0]&&(0===p[0].indexOf("[")?p[0]=p[0].replace(/[[\]]/g,""):p[0]='"'+p[0].replace(/"|'/g,"")+'"')),i.push({type:"helper",helperName:s,contextName:p,hash:c}))}}return i},parseJsVariable:function(e,i,n){return e.split(/([+ \-*/^()&=|<>!%:?])/g).reduce(function(e,t){if(!t)return e;if(t.indexOf(i)<0)return e.push(t),e;if(!n)return e.push(JSON.stringify("")),e;var r=n;return 0<=t.indexOf(i+".")&&t.split(i+".")[1].split(".").forEach(function(e){r=e in r?r[e]:void 0}),("string"==typeof r||Array.isArray(r)||r.constructor&&r.constructor===Object)&&(r=JSON.stringify(r)),void 0===r&&(r="undefined"),e.push(r),e},[]).join("")},parseJsParents:function(e,n){return e.split(/([+ \-*^()&=|<>!%:?])/g).reduce(function(e,t){if(!t)return e;if(t.indexOf("../")<0)return e.push(t),e;if(!n||0===n.length)return e.push(JSON.stringify("")),e;var r=t.split("../").length-1,i=r>n.length?n[n.length-1]:n[r-1];return t.replace(/..\//g,"").split(".").forEach(function(e){i=void 0!==i[e]?i[e]:"undefined"}),!1===i||!0===i?e.push(JSON.stringify(i)):null===i||"undefined"===i?e.push(JSON.stringify("")):e.push(JSON.stringify(i)),e},[]).join("")},getCompileVar:function(e,t,r){void 0===r&&(r="data_1");var i,n,l=t,a=0;i=0===e.indexOf("../")?(a=e.split("../").length-1,l="ctx_"+(1<=(n=l.split("_")[1]-a)?n:1),e.split("../")[a].split(".")):0===e.indexOf("@global")?(l="Template7.global",e.split("@global.")[1].split(".")):0===e.indexOf("@root")?(l="root",e.split("@root.")[1].split(".")):e.split(".");for(var s=0;s<i.length;s+=1){var o=i[s];if(0===o.indexOf("@")){var p=r.split("_")[1];0<a&&(p=n),0<s?l+="[(data_"+p+" && data_"+p+"."+o.replace("@","")+")]":l="(data_"+p+" && data_"+p+"."+o.replace("@","")+")"}else(Number.isFinite?Number.isFinite(o):Template7Context.isFinite(o))?l+="["+o+"]":"this"===o||0<=o.indexOf("this.")||0<=o.indexOf("this[")||0<=o.indexOf("this(")?l=o.replace("this",t):l+="."+o}return l},getCompiledArguments:function(e,t,r){for(var i=[],n=0;n<e.length;n+=1)/^['"]/.test(e[n])?i.push(e[n]):/^(true|false|\d+)$/.test(e[n])?i.push(e[n]):i.push(Template7Utils.getCompileVar(e[n],t,r));return i.join(", ")}},Template7Helpers={_partial:function(e,t){var r=this,i=Template7Class.partials[e];return!i||i&&!i.template?"":(i.compiled||(i.compiled=new Template7Class(i.template).compile()),Object.keys(t.hash).forEach(function(e){r[e]=t.hash[e]}),i.compiled(r,t.data,t.root))},escape:function(e){if(null==e)return"";if("string"!=typeof e)throw new Error('Template7: Passed context to "escape" helper should be a string');return Template7Utils.escape(e)},if:function(e,t){var r=e;return Template7Utils.isFunction(r)&&(r=r.call(this)),r?t.fn(this,t.data):t.inverse(this,t.data)},unless:function(e,t){var r=e;return Template7Utils.isFunction(r)&&(r=r.call(this)),r?t.inverse(this,t.data):t.fn(this,t.data)},each:function(e,t){var r=e,i="",n=0;if(Template7Utils.isFunction(r)&&(r=r.call(this)),Array.isArray(r)){for(t.hash.reverse&&(r=r.reverse()),n=0;n<r.length;n+=1)i+=t.fn(r[n],{first:0===n,last:n===r.length-1,index:n});t.hash.reverse&&(r=r.reverse())}else for(var l in r)n+=1,i+=t.fn(r[l],{key:l});return 0<n?i:t.inverse(this)},with:function(e,t){var r=e;return Template7Utils.isFunction(r)&&(r=e.call(this)),t.fn(r)},join:function(e,t){var r=e;return Template7Utils.isFunction(r)&&(r=r.call(this)),r.join(t.hash.delimiter||t.hash.delimeter)},js:function js(expression,options){var data=options.data,func,execute=expression;return"index first last key".split(" ").forEach(function(e){if(void 0!==data[e]){var t=new RegExp("this.@"+e,"g"),r=new RegExp("@"+e,"g");execute=execute.replace(t,JSON.stringify(data[e])).replace(r,JSON.stringify(data[e]))}}),options.root&&0<=execute.indexOf("@root")&&(execute=Template7Utils.parseJsVariable(execute,"@root",options.root)),0<=execute.indexOf("@global")&&(execute=Template7Utils.parseJsVariable(execute,"@global",Template7Context.Template7.global)),0<=execute.indexOf("../")&&(execute=Template7Utils.parseJsParents(execute,options.parents)),func=0<=execute.indexOf("return")?"(function(){"+execute+"})":"(function(){return ("+execute+")})",eval(func).call(this)},js_if:function js_if(expression,options){var data=options.data,func,execute=expression;"index first last key".split(" ").forEach(function(e){if(void 0!==data[e]){var t=new RegExp("this.@"+e,"g"),r=new RegExp("@"+e,"g");execute=execute.replace(t,JSON.stringify(data[e])).replace(r,JSON.stringify(data[e]))}}),options.root&&0<=execute.indexOf("@root")&&(execute=Template7Utils.parseJsVariable(execute,"@root",options.root)),0<=execute.indexOf("@global")&&(execute=Template7Utils.parseJsVariable(execute,"@global",Template7Context.Template7.global)),0<=execute.indexOf("../")&&(execute=Template7Utils.parseJsParents(execute,options.parents)),func=0<=execute.indexOf("return")?"(function(){"+execute+"})":"(function(){return ("+execute+")})";var condition=eval(func).call(this);return condition?options.fn(this,options.data):options.inverse(this,options.data)}};Template7Helpers.js_compare=Template7Helpers.js_if;var Template7Options={},Template7Partials={},Template7Class=function(e){this.template=e},staticAccessors={options:{configurable:!0},partials:{configurable:!0},helpers:{configurable:!0}};function Template7(){for(var e=[],t=arguments.length;t--;)e[t]=arguments[t];var r=e[0],i=e[1];if(2!==e.length)return new Template7Class(r);var n=new Template7Class(r),l=n.compile()(i);return n=null,l}return Template7Class.prototype.compile=function compile(template,depth){void 0===template&&(template=this.template),void 0===depth&&(depth=1);var t=this;if(t.compiled)return t.compiled;if("string"!=typeof template)throw new Error("Template7: Template must be a string");var stringToBlocks=Template7Utils.stringToBlocks,getCompileVar=Template7Utils.getCompileVar,getCompiledArguments=Template7Utils.getCompiledArguments,blocks=stringToBlocks(template),ctx="ctx_"+depth,data="data_"+depth;if(0===blocks.length)return function(){return""};function getCompileFn(e,r){return e.content?t.compile(e.content,r):function(){return""}}function getCompileInverse(e,r){return e.inverseContent?t.compile(e.inverseContent,r):function(){return""}}var resultString="",i;for(resultString+=1===depth?"(function ("+ctx+", "+data+", root) {\n":"(function ("+ctx+", "+data+") {\n",1===depth&&(resultString+="function isArray(arr){return Array.isArray(arr);}\n",resultString+="function isFunction(func){return (typeof func === 'function');}\n",resultString+='function c(val, ctx) {if (typeof val !== "undefined" && val !== null) {if (isFunction(val)) {return val.call(ctx);} else return val;} else return "";}\n',resultString+="root = root || ctx_1 || {};\n"),resultString+="var r = '';\n",i=0;i<blocks.length;i+=1){var block=blocks[i];if("plain"!==block.type){var variable=void 0,compiledArguments=void 0;if("variable"===block.type&&(variable=getCompileVar(block.contextName,ctx,data),resultString+="r += c("+variable+", "+ctx+");"),"helper"===block.type){var parents=void 0;if("ctx_1"!==ctx){for(var level=ctx.split("_")[1],parentsString="ctx_"+(level-1),j=level-2;1<=j;j-=1)parentsString+=", ctx_"+j;parents="["+parentsString+"]"}else parents="["+ctx+"]";var dynamicHelper=void 0;if(0===block.helperName.indexOf("[")&&(block.helperName=getCompileVar(block.helperName.replace(/[[\]]/g,""),ctx,data),dynamicHelper=!0),dynamicHelper||block.helperName in Template7Helpers)compiledArguments=getCompiledArguments(block.contextName,ctx,data),resultString+="r += (Template7Helpers"+(dynamicHelper?"["+block.helperName+"]":"."+block.helperName)+").call("+ctx+", "+(compiledArguments&&compiledArguments+", ")+"{hash:"+JSON.stringify(block.hash)+", data: "+data+" || {}, fn: "+getCompileFn(block,depth+1)+", inverse: "+getCompileInverse(block,depth+1)+", root: root, parents: "+parents+"});";else{if(0<block.contextName.length)throw new Error('Template7: Missing helper: "'+block.helperName+'"');variable=getCompileVar(block.helperName,ctx,data),resultString+="if ("+variable+") {",resultString+="if (isArray("+variable+")) {",resultString+="r += (Template7Helpers.each).call("+ctx+", "+variable+", {hash:"+JSON.stringify(block.hash)+", data: "+data+" || {}, fn: "+getCompileFn(block,depth+1)+", inverse: "+getCompileInverse(block,depth+1)+", root: root, parents: "+parents+"});",resultString+="}else {",resultString+="r += (Template7Helpers.with).call("+ctx+", "+variable+", {hash:"+JSON.stringify(block.hash)+", data: "+data+" || {}, fn: "+getCompileFn(block,depth+1)+", inverse: "+getCompileInverse(block,depth+1)+", root: root, parents: "+parents+"});",resultString+="}}"}}}else resultString+="r +='"+block.content.replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/'/g,"\\'")+"';"}return resultString+="\nreturn r;})",1===depth?(t.compiled=eval(resultString),t.compiled):resultString},staticAccessors.options.get=function(){return Template7Options},staticAccessors.partials.get=function(){return Template7Partials},staticAccessors.helpers.get=function(){return Template7Helpers},Object.defineProperties(Template7Class,staticAccessors),Template7.registerHelper=function(e,t){Template7Class.helpers[e]=t},Template7.unregisterHelper=function(e){Template7Class.helpers[e]=void 0,delete Template7Class.helpers[e]},Template7.registerPartial=function(e,t){Template7Class.partials[e]={template:t}},Template7.unregisterPartial=function(e){Template7Class.partials[e]&&(Template7Class.partials[e]=void 0,delete Template7Class.partials[e])},Template7.compile=function(e,t){return new Template7Class(e,t).compile()},Template7.options=Template7Class.options,Template7.helpers=Template7Class.helpers,Template7.partials=Template7Class.partials,Template7});
//# sourceMappingURL=template7.min.js.map