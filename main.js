///<reference path="../src/types/core.d.ts" />
function main() {
    //------------------------ 用户修改内容 ------------------------//

    this.version = '1.0.0'; // 游戏版本号；如果更改了游戏内容建议修改此version以免造成缓存问题。

    this.useCompress = false; // 是否使用压缩文件
    this.pluginUseCompress = true;
    // 当你即将发布你的塔时，请使用“JS代码压缩工具”将所有js代码进行压缩，然后将这里的useCompress改为true。
    // 请注意，只有useCompress是false时才会读取floors目录下的文件，为true时会直接读取libs目录下的floors.min.js文件。
    // 如果要进行剧本的修改请务必将其改成false。

    this.bgmRemote = false; // 是否采用远程BGM
    this.bgmRemoteRoot = 'https://h5mota.com/music/'; // 远程BGM的根目录

    this.isCompetition = false; // 是否是比赛模式

    this.savePages = 1000; // 存档页数，每页可存5个；默认为1000页5000个存档
    this.criticalUseLoop = 1; // 循环临界的分界

    //------------------------ 用户修改内容 END ------------------------//

    this.dom = {
        body: document.body,
        gameGroup: document.getElementById('gameGroup'),
        mainTips: document.getElementById('mainTips'),
        musicBtn: document.getElementById('musicBtn'),
        enlargeBtn: document.createElement('img'),
        startPanel: document.getElementById('startPanel'),
        startTop: document.getElementById('startTop'),
        startTopProgressBar: document.getElementById('startTopProgressBar'),
        startTopProgress: document.getElementById('startTopProgress'),
        startTopLoadTips: document.getElementById('startTopLoadTips'),
        floorMsgGroup: document.getElementById('floorMsgGroup'),
        logoLabel: document.getElementById('logoLabel'),
        versionLabel: document.getElementById('versionLabel'),
        floorNameLabel: document.getElementById('floorNameLabel'),
        statusBar: document.getElementById('statusBar'),
        status: document.getElementsByClassName('status'),
        toolBar: document.getElementById('toolBar'),
        tools: document.getElementsByClassName('tools'),
        gameCanvas: document.getElementsByClassName('gameCanvas'),
        gif: document.getElementById('gif'),
        gif2: document.getElementById('gif2'),
        gameDraw: document.getElementById('gameDraw'),
        startButtons: document.getElementById('startButtons'),
        playGame: document.getElementById('playGame'),
        loadGame: document.getElementById('loadGame'),
        replayGame: document.getElementById('replayGame'),
        levelChooseButtons: document.getElementById('levelChooseButtons'),
        data: document.getElementById('data'),
        statusLabels: document.getElementsByClassName('statusLabel'),
        statusTexts: document.getElementsByClassName('statusText'),
        floorCol: document.getElementById('floorCol'),
        nameCol: document.getElementById('nameCol'),
        lvCol: document.getElementById('lvCol'),
        hpmaxCol: document.getElementById('hpmaxCol'),
        hpCol: document.getElementById('hpCol'),
        manaCol: document.getElementById('manaCol'),
        atkCol: document.getElementById('atkCol'),
        defCol: document.getElementById('defCol'),
        mdefCol: document.getElementById('mdefCol'),
        moneyCol: document.getElementById('moneyCol'),
        expCol: document.getElementById('expCol'),
        upCol: document.getElementById('upCol'),
        keyCol: document.getElementById('keyCol'),
        pzfCol: document.getElementById('pzfCol'),
        debuffCol: document.getElementById('debuffCol'),
        skillCol: document.getElementById('skillCol'),
        hard: document.getElementById('hard'),
        statusCanvas: document.getElementById('statusCanvas'),
        statusCanvasCtx: document
            .getElementById('statusCanvas')
            .getContext('2d'),
        inputDiv: document.getElementById('inputDiv'),
        inputMessage: document.getElementById('inputMessage'),
        inputBox: document.getElementById('inputBox'),
        inputYes: document.getElementById('inputYes'),
        inputNo: document.getElementById('inputNo'),
        next: document.getElementById('next')
    };
    this.mode = 'play';
    this.loadList = [
        'loader',
        'control',
        'utils',
        'items',
        'icons',
        'maps',
        'enemys',
        'events',
        'actions',
        'data',
        'ui',
        'extensions',
        'core'
    ];
    this.pureData = [
        'data',
        'enemys',
        'icons',
        'maps',
        'items',
        'functions',
        'events',
        'plugins'
    ];
    this.materials = [
        'animates',
        'enemys',
        'items',
        'npcs',
        'terrains',
        'enemy48',
        'npc48',
        'icons'
    ];

    this.statusBar = {
        image: {
            floor: document.getElementById('img-floor'),
            name: document.getElementById('img-name'),
            lv: document.getElementById('img-lv'),
            hpmax: document.getElementById('img-hpmax'),
            hp: document.getElementById('img-hp'),
            mana: document.getElementById('img-mana'),
            atk: document.getElementById('img-atk'),
            def: document.getElementById('img-def'),
            mdef: document.getElementById('img-mdef'),
            money: document.getElementById('img-money'),
            exp: document.getElementById('img-exp'),
            up: document.getElementById('img-up'),
            skill: document.getElementById('img-skill'),
            book: document.getElementById('img-book'),
            fly: document.getElementById('img-fly'),
            toolbox: document.getElementById('img-toolbox'),
            keyboard: document.getElementById('img-keyboard'),
            shop: document.getElementById('img-shop'),
            save: document.getElementById('img-save'),
            load: document.getElementById('img-load'),
            settings: document.getElementById('img-settings'),
            btn1: document.getElementById('img-btn1'),
            btn2: document.getElementById('img-btn2'),
            btn3: document.getElementById('img-btn3'),
            btn4: document.getElementById('img-btn4'),
            btn5: document.getElementById('img-btn5'),
            btn6: document.getElementById('img-btn6'),
            btn7: document.getElementById('img-btn7'),
            btn8: document.getElementById('img-btn8')
        },
        icons: {
            floor: 0,
            name: null,
            lv: 1,
            hpmax: 2,
            hp: 3,
            atk: 4,
            def: 5,
            mdef: 6,
            money: 7,
            exp: 8,
            up: 9,
            book: 10,
            fly: 11,
            toolbox: 12,
            keyboard: 13,
            shop: 14,
            save: 15,
            load: 16,
            settings: 17,
            play: 18,
            pause: 19,
            stop: 20,
            speedDown: 21,
            speedUp: 22,
            rewind: 23,
            equipbox: 24,
            mana: 25,
            skill: 26,
            btn1: 27,
            btn2: 28,
            btn3: 29,
            btn4: 30,
            btn5: 31,
            btn6: 32,
            btn7: 33,
            btn8: 34
        },
        floor: document.getElementById('floor'),
        name: document.getElementById('name'),
        lv: document.getElementById('lv'),
        hpmax: document.getElementById('hpmax'),
        hp: document.getElementById('hp'),
        mana: document.getElementById('mana'),
        atk: document.getElementById('atk'),
        def: document.getElementById('def'),
        mdef: document.getElementById('mdef'),
        money: document.getElementById('money'),
        exp: document.getElementById('exp'),
        up: document.getElementById('up'),
        skill: document.getElementById('skill'),
        yellowKey: document.getElementById('yellowKey'),
        blueKey: document.getElementById('blueKey'),
        redKey: document.getElementById('redKey'),
        greenKey: document.getElementById('greenKey'),
        poison: document.getElementById('poison'),
        weak: document.getElementById('weak'),
        curse: document.getElementById('curse'),
        pickaxe: document.getElementById('pickaxe'),
        bomb: document.getElementById('bomb'),
        fly: document.getElementById('fly'),
        hard: document.getElementById('hard')
    };
    this.floors = {};
    this.canvas = {};

    this.__VERSION__ = '2.10.0';
    this.__VERSION_CODE__ = 510;
}
function _typeof(obj){"@babel/helpers - typeof";return _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(obj){return typeof obj}:function(obj){return obj&&"function"==typeof Symbol&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj},_typeof(obj)}function _createForOfIteratorHelper(o,allowArrayLike){var it=typeof Symbol!=="undefined"&&o[Symbol.iterator]||o["@@iterator"];if(!it){if(Array.isArray(o)||(it=_unsupportedIterableToArray(o))||allowArrayLike&&o&&typeof o.length==="number"){if(it)o=it;var i=0;var F=function F(){};return{s:F,n:function n(){if(i>=o.length)return{done:true};return{done:false,value:o[i++]}},e:function e(_e){throw _e},f:F}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var normalCompletion=true,didErr=false,err;return{s:function s(){it=it.call(o)},n:function n(){var step=it.next();normalCompletion=step.done;return step},e:function e(_e2){didErr=true;err=_e2},f:function f(){try{if(!normalCompletion&&it["return"]!=null)it["return"]()}finally{if(didErr)throw err}}}}function _unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o==="string")return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n==="Object"&&o.constructor)n=o.constructor.name;if(n==="Map"||n==="Set")return Array.from(o);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen)}function _arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++)arr2[i]=arr[i];return arr2}function _regeneratorRuntime(){"use strict";_regeneratorRuntime=function _regeneratorRuntime(){return exports};var exports={},Op=Object.prototype,hasOwn=Op.hasOwnProperty,defineProperty=Object.defineProperty||function(obj,key,desc){obj[key]=desc.value},$Symbol="function"==typeof Symbol?Symbol:{},iteratorSymbol=$Symbol.iterator||"@@iterator",asyncIteratorSymbol=$Symbol.asyncIterator||"@@asyncIterator",toStringTagSymbol=$Symbol.toStringTag||"@@toStringTag";function define(obj,key,value){return Object.defineProperty(obj,key,{value:value,enumerable:!0,configurable:!0,writable:!0}),obj[key]}try{define({},"")}catch(err){define=function define(obj,key,value){return obj[key]=value}}function wrap(innerFn,outerFn,self,tryLocsList){var protoGenerator=outerFn&&outerFn.prototype instanceof Generator?outerFn:Generator,generator=Object.create(protoGenerator.prototype),context=new Context(tryLocsList||[]);return defineProperty(generator,"_invoke",{value:makeInvokeMethod(innerFn,self,context)}),generator}function tryCatch(fn,obj,arg){try{return{type:"normal",arg:fn.call(obj,arg)}}catch(err){return{type:"throw",arg:err}}}exports.wrap=wrap;var ContinueSentinel={};function Generator(){}function GeneratorFunction(){}function GeneratorFunctionPrototype(){}var IteratorPrototype={};define(IteratorPrototype,iteratorSymbol,function(){return this});var getProto=Object.getPrototypeOf,NativeIteratorPrototype=getProto&&getProto(getProto(values([])));NativeIteratorPrototype&&NativeIteratorPrototype!==Op&&hasOwn.call(NativeIteratorPrototype,iteratorSymbol)&&(IteratorPrototype=NativeIteratorPrototype);var Gp=GeneratorFunctionPrototype.prototype=Generator.prototype=Object.create(IteratorPrototype);function defineIteratorMethods(prototype){["next","throw","return"].forEach(function(method){define(prototype,method,function(arg){return this._invoke(method,arg)})})}function AsyncIterator(generator,PromiseImpl){function invoke(method,arg,resolve,reject){var record=tryCatch(generator[method],generator,arg);if("throw"!==record.type){var result=record.arg,value=result.value;return value&&"object"==_typeof(value)&&hasOwn.call(value,"__await")?PromiseImpl.resolve(value.__await).then(function(value){invoke("next",value,resolve,reject)},function(err){invoke("throw",err,resolve,reject)}):PromiseImpl.resolve(value).then(function(unwrapped){result.value=unwrapped,resolve(result)},function(error){return invoke("throw",error,resolve,reject)})}reject(record.arg)}var previousPromise;defineProperty(this,"_invoke",{value:function value(method,arg){function callInvokeWithMethodAndArg(){return new PromiseImpl(function(resolve,reject){invoke(method,arg,resolve,reject)})}return previousPromise=previousPromise?previousPromise.then(callInvokeWithMethodAndArg,callInvokeWithMethodAndArg):callInvokeWithMethodAndArg()}})}function makeInvokeMethod(innerFn,self,context){var state="suspendedStart";return function(method,arg){if("executing"===state)throw new Error("Generator is already running");if("completed"===state){if("throw"===method)throw arg;return doneResult()}for(context.method=method,context.arg=arg;;){var delegate=context.delegate;if(delegate){var delegateResult=maybeInvokeDelegate(delegate,context);if(delegateResult){if(delegateResult===ContinueSentinel)continue;return delegateResult}}if("next"===context.method)context.sent=context._sent=context.arg;else if("throw"===context.method){if("suspendedStart"===state)throw state="completed",context.arg;context.dispatchException(context.arg)}else"return"===context.method&&context.abrupt("return",context.arg);state="executing";var record=tryCatch(innerFn,self,context);if("normal"===record.type){if(state=context.done?"completed":"suspendedYield",record.arg===ContinueSentinel)continue;return{value:record.arg,done:context.done}}"throw"===record.type&&(state="completed",context.method="throw",context.arg=record.arg)}}}function maybeInvokeDelegate(delegate,context){var methodName=context.method,method=delegate.iterator[methodName];if(undefined===method)return context.delegate=null,"throw"===methodName&&delegate.iterator["return"]&&(context.method="return",context.arg=undefined,maybeInvokeDelegate(delegate,context),"throw"===context.method)||"return"!==methodName&&(context.method="throw",context.arg=new TypeError("The iterator does not provide a '"+methodName+"' method")),ContinueSentinel;var record=tryCatch(method,delegate.iterator,context.arg);if("throw"===record.type)return context.method="throw",context.arg=record.arg,context.delegate=null,ContinueSentinel;var info=record.arg;return info?info.done?(context[delegate.resultName]=info.value,context.next=delegate.nextLoc,"return"!==context.method&&(context.method="next",context.arg=undefined),context.delegate=null,ContinueSentinel):info:(context.method="throw",context.arg=new TypeError("iterator result is not an object"),context.delegate=null,ContinueSentinel)}function pushTryEntry(locs){var entry={tryLoc:locs[0]};1 in locs&&(entry.catchLoc=locs[1]),2 in locs&&(entry.finallyLoc=locs[2],entry.afterLoc=locs[3]),this.tryEntries.push(entry)}function resetTryEntry(entry){var record=entry.completion||{};record.type="normal",delete record.arg,entry.completion=record}function Context(tryLocsList){this.tryEntries=[{tryLoc:"root"}],tryLocsList.forEach(pushTryEntry,this),this.reset(!0)}function values(iterable){if(iterable){var iteratorMethod=iterable[iteratorSymbol];if(iteratorMethod)return iteratorMethod.call(iterable);if("function"==typeof iterable.next)return iterable;if(!isNaN(iterable.length)){var i=-1,next=function next(){for(;++i<iterable.length;)if(hasOwn.call(iterable,i))return next.value=iterable[i],next.done=!1,next;return next.value=undefined,next.done=!0,next};return next.next=next}}return{next:doneResult}}function doneResult(){return{value:undefined,done:!0}}return GeneratorFunction.prototype=GeneratorFunctionPrototype,defineProperty(Gp,"constructor",{value:GeneratorFunctionPrototype,configurable:!0}),defineProperty(GeneratorFunctionPrototype,"constructor",{value:GeneratorFunction,configurable:!0}),GeneratorFunction.displayName=define(GeneratorFunctionPrototype,toStringTagSymbol,"GeneratorFunction"),exports.isGeneratorFunction=function(genFun){var ctor="function"==typeof genFun&&genFun.constructor;return!!ctor&&(ctor===GeneratorFunction||"GeneratorFunction"===(ctor.displayName||ctor.name))},exports.mark=function(genFun){return Object.setPrototypeOf?Object.setPrototypeOf(genFun,GeneratorFunctionPrototype):(genFun.__proto__=GeneratorFunctionPrototype,define(genFun,toStringTagSymbol,"GeneratorFunction")),genFun.prototype=Object.create(Gp),genFun},exports.awrap=function(arg){return{__await:arg}},defineIteratorMethods(AsyncIterator.prototype),define(AsyncIterator.prototype,asyncIteratorSymbol,function(){return this}),exports.AsyncIterator=AsyncIterator,exports.async=function(innerFn,outerFn,self,tryLocsList,PromiseImpl){void 0===PromiseImpl&&(PromiseImpl=Promise);var iter=new AsyncIterator(wrap(innerFn,outerFn,self,tryLocsList),PromiseImpl);return exports.isGeneratorFunction(outerFn)?iter:iter.next().then(function(result){return result.done?result.value:iter.next()})},defineIteratorMethods(Gp),define(Gp,toStringTagSymbol,"Generator"),define(Gp,iteratorSymbol,function(){return this}),define(Gp,"toString",function(){return"[object Generator]"}),exports.keys=function(val){var object=Object(val),keys=[];for(var key in object)keys.push(key);return keys.reverse(),function next(){for(;keys.length;){var key=keys.pop();if(key in object)return next.value=key,next.done=!1,next}return next.done=!0,next}},exports.values=values,Context.prototype={constructor:Context,reset:function reset(skipTempReset){if(this.prev=0,this.next=0,this.sent=this._sent=undefined,this.done=!1,this.delegate=null,this.method="next",this.arg=undefined,this.tryEntries.forEach(resetTryEntry),!skipTempReset)for(var name in this)"t"===name.charAt(0)&&hasOwn.call(this,name)&&!isNaN(+name.slice(1))&&(this[name]=undefined)},stop:function stop(){this.done=!0;var rootRecord=this.tryEntries[0].completion;if("throw"===rootRecord.type)throw rootRecord.arg;return this.rval},dispatchException:function dispatchException(exception){if(this.done)throw exception;var context=this;function handle(loc,caught){return record.type="throw",record.arg=exception,context.next=loc,caught&&(context.method="next",context.arg=undefined),!!caught}for(var i=this.tryEntries.length-1;i>=0;--i){var entry=this.tryEntries[i],record=entry.completion;if("root"===entry.tryLoc)return handle("end");if(entry.tryLoc<=this.prev){var hasCatch=hasOwn.call(entry,"catchLoc"),hasFinally=hasOwn.call(entry,"finallyLoc");if(hasCatch&&hasFinally){if(this.prev<entry.catchLoc)return handle(entry.catchLoc,!0);if(this.prev<entry.finallyLoc)return handle(entry.finallyLoc)}else if(hasCatch){if(this.prev<entry.catchLoc)return handle(entry.catchLoc,!0)}else{if(!hasFinally)throw new Error("try statement without catch or finally");if(this.prev<entry.finallyLoc)return handle(entry.finallyLoc)}}}},abrupt:function abrupt(type,arg){for(var i=this.tryEntries.length-1;i>=0;--i){var entry=this.tryEntries[i];if(entry.tryLoc<=this.prev&&hasOwn.call(entry,"finallyLoc")&&this.prev<entry.finallyLoc){var finallyEntry=entry;break}}finallyEntry&&("break"===type||"continue"===type)&&finallyEntry.tryLoc<=arg&&arg<=finallyEntry.finallyLoc&&(finallyEntry=null);var record=finallyEntry?finallyEntry.completion:{};return record.type=type,record.arg=arg,finallyEntry?(this.method="next",this.next=finallyEntry.finallyLoc,ContinueSentinel):this.complete(record)},complete:function complete(record,afterLoc){if("throw"===record.type)throw record.arg;return"break"===record.type||"continue"===record.type?this.next=record.arg:"return"===record.type?(this.rval=this.arg=record.arg,this.method="return",this.next="end"):"normal"===record.type&&afterLoc&&(this.next=afterLoc),ContinueSentinel},finish:function finish(finallyLoc){for(var i=this.tryEntries.length-1;i>=0;--i){var entry=this.tryEntries[i];if(entry.finallyLoc===finallyLoc)return this.complete(entry.completion,entry.afterLoc),resetTryEntry(entry),ContinueSentinel}},"catch":function _catch(tryLoc){for(var i=this.tryEntries.length-1;i>=0;--i){var entry=this.tryEntries[i];if(entry.tryLoc===tryLoc){var record=entry.completion;if("throw"===record.type){var thrown=record.arg;resetTryEntry(entry)}return thrown}}throw new Error("illegal catch attempt")},delegateYield:function delegateYield(iterable,resultName,nextLoc){return this.delegate={iterator:values(iterable),resultName:resultName,nextLoc:nextLoc},"next"===this.method&&(this.arg=undefined),ContinueSentinel}},exports}function asyncGeneratorStep(gen,resolve,reject,_next,_throw,key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{Promise.resolve(value).then(_next,_throw)}}function _asyncToGenerator(fn){return function(){var self=this,args=arguments;return new Promise(function(resolve,reject){var gen=fn.apply(self,args);function _next(value){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"next",value)}function _throw(err){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"throw",err)}_next(undefined)})}}main.prototype.loadScript=function(){var _ref=_asyncToGenerator(_regeneratorRuntime().mark(function _callee(src,module){var script;return _regeneratorRuntime().wrap(function _callee$(_context){while(1)switch(_context.prev=_context.next){case 0:script=document.createElement("script");script.src=src;if(module)script.type="module";document.body.appendChild(script);_context.next=6;return new Promise(function(res){script.addEventListener("load",res)});case 6:case"end":return _context.stop();}},_callee)}));return function(_x,_x2){return _ref.apply(this,arguments)}}();main.prototype.init=function(){var _ref2=_asyncToGenerator(_regeneratorRuntime().mark(function _callee2(mode,callback){var a,b,i,mainData,_iterator,_step,name,coreData,auto;return _regeneratorRuntime().wrap(function _callee2$(_context2){while(1)switch(_context2.prev=_context2.next){case 0:_context2.prev=0;a={};b={};new Proxy(a,b);new Promise(function(res){return res()});eval("`${123}`");_context2.next=13;break;case 8:_context2.prev=8;_context2.t0=_context2["catch"](0);alert("\u6D4F\u89C8\u5668\u7248\u672C\u8FC7\u4F4E\uFF0C\u65E0\u6CD5\u6E38\u73A9\u672C\u5854\uFF01");alert("\u5EFA\u8BAE\u4F7F\u7528Edge\u6D4F\u89C8\u5668\u6216Chrome\u6D4F\u89C8\u5668\u6E38\u73A9\uFF01");return _context2.abrupt("return");case 13:for(i=0;i<main.dom.gameCanvas.length;i++){main.canvas[main.dom.gameCanvas[i].id]=main.dom.gameCanvas[i].getContext("2d")}main.mode=mode;if(!main.useCompress){_context2.next=20;break}_context2.next=18;return main.loadScript("project/project.min.js?v=".concat(main.version));case 18:_context2.next=22;break;case 20:_context2.next=22;return Promise.all(main.pureData.map(function(v){return main.loadScript("project/".concat(v,".js?v=").concat(main.version))}));case 22:mainData=data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d.main;Object.assign(main,mainData);main.importFonts(main.fonts);if(!main.useCompress){_context2.next=30;break}_context2.next=28;return main.loadScript("libs/libs.min.js?v=".concat(main.version));case 28:_context2.next=32;break;case 30:_context2.next=32;return Promise.all(main.loadList.map(function(v){return main.loadScript("libs/".concat(v,".js?v=").concat(main.version))}));case 32:_iterator=_createForOfIteratorHelper(main.loadList);_context2.prev=33;_iterator.s();case 35:if((_step=_iterator.n()).done){_context2.next=42;break}name=_step.value;if(!(name==="core")){_context2.next=39;break}return _context2.abrupt("continue",40);case 39:core[name]=new window[name];case 40:_context2.next=35;break;case 42:_context2.next=47;break;case 44:_context2.prev=44;_context2.t1=_context2["catch"](33);_iterator.e(_context2.t1);case 47:_context2.prev=47;_iterator.f();return _context2.finish(47);case 50:main.setMainTipsText("\u6B63\u5728\u52A0\u8F7D\u697C\u5C42\u6587\u4EF6...");if(!main.useCompress){_context2.next=57;break}_context2.next=54;return main.loadScript("project/floors.min.js?v=".concat(main.version));case 54:main.dom.mainTips.style.display="none";_context2.next=68;break;case 57:_context2.prev=57;_context2.next=60;return main.loadScript("/all/__all_floors__.js?v=".concat(main.version,"&id=").concat(main.floorIds.join(",")));case 60:main.dom.mainTips.style.display="none";main.supportBunch=true;_context2.next=68;break;case 64:_context2.prev=64;_context2.t2=_context2["catch"](57);_context2.next=68;return Promise.all(mainData.floorIds.map(function(v){return main.loadScript("project/floors/".concat(v,".js"))}));case 68:coreData={};["dom","statusBar","canvas","images","tilesets","materials","animates","bgms","sounds","floorIds","floors","floorPartitions"].forEach(function(t){coreData[t]=main[t]});core.init(coreData,callback);core.resize();main.core=core;auto=core.getLocalStorage("autoScale");if(auto==null){core.setLocalStorage("autoScale",true)}if(auto&&!core.domStyle.isVertical){try{core.plugin.utils.maxGameScale();if(!core.getLocalStorage("fullscreen",false)){requestAnimationFrame(function(){var style=getComputedStyle(main.dom.gameGroup);var height=parseFloat(style.height);if(height>window.innerHeight*0.95){core.control.setDisplayScale(-1);if(!core.isPlaying()&&core.flags.enableHDCanvas){core.domStyle.ratio=Math.max(window.devicePixelRatio||1,core.domStyle.scale);core.resize()}}})}}catch(_unused3){}}case 76:case"end":return _context2.stop();}},_callee2,null,[[0,8],[33,44,47,50],[57,64]])}));return function(_x3,_x4){return _ref2.apply(this,arguments)}}();main.prototype.setMainTipsText=function(text){main.dom.mainTips.innerHTML=text};main.prototype.createOnChoiceAnimation=function(){var borderColor=main.dom.startButtonGroup.style.caretColor||"rgb(255, 215, 0)";var rgb=/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+\s*)?\)$/.exec(borderColor);if(rgb!=null){var value=rgb[1]+", "+rgb[2]+", "+rgb[3];var style=document.createElement("style");style.type="text/css";var keyFrames="onChoice { "+"0% { border-color: rgba("+value+", 0.9); } "+"50% { border-color: rgba("+value+", 0.3); } "+"100% { border-color: rgba("+value+", 0.9); } "+"}";style.innerHTML="@-webkit-keyframes "+keyFrames+" @keyframes "+keyFrames;document.body.appendChild(style)}};main.prototype.importFonts=function(fonts){if(!(fonts instanceof Array)||fonts.length==0)return;var style=document.createElement("style");style.type="text/css";var html="";fonts.forEach(function(font){html+="@font-face { font-family: \""+font+"\"; src: url(\"project/fonts/"+font+".ttf\") format(\"truetype\"); }"});style.innerHTML=html;document.body.appendChild(style)};main.prototype.listen=function(){window.onresize=function(){try{core.resize()}catch(ee){console.error(ee)}};main.dom.body.onkeydown=function(e){if(main.editorOpened)return;try{if(e.keyCode===27)e.preventDefault();if(main.dom.inputDiv.style.display=="block")return;if(core&&(core.isPlaying()||core.status.lockControl))core.onkeyDown(e)}catch(ee){console.error(ee)}};main.dom.body.onkeyup=function(e){if(main.editorOpened)return;try{if(main.dom.startPanel.style.display=="block"&&(main.dom.startButtons.style.display=="block"||main.dom.levelChooseButtons.style.display=="block")){if(e.keyCode==38||e.keyCode==33)main.selectButton((main.selectedButton||0)-1);else if(e.keyCode==40||e.keyCode==34)main.selectButton((main.selectedButton||0)+1);else if(e.keyCode==67||e.keyCode==13||e.keyCode==32)main.selectButton(main.selectedButton);else if(e.keyCode==27&&main.dom.levelChooseButtons.style.display=="block"){core.showStartAnimate(true);e.preventDefault()}e.stopPropagation();return}if(main.dom.inputDiv.style.display=="block"){if(e.keyCode==13){setTimeout(function(){main.dom.inputYes.click()},50)}else if(e.keyCode==27){setTimeout(function(){main.dom.inputNo.click()},50)}return}if(core&&core.isPlaying&&core.status&&(core.isPlaying()||core.status.lockControl))core.onkeyUp(e)}catch(ee){console.error(ee)}};main.dom.body.onselectstart=function(){return false};main.dom.data.onmousedown=function(e){try{e.stopPropagation();var loc=core.actions._getClickLoc(e.clientX,e.clientY);if(loc==null)return;core.ondown(loc)}catch(ee){console.error(ee)}};main.dom.data.onmousemove=function(e){try{var loc=core.actions._getClickLoc(e.clientX,e.clientY);if(loc==null)return;core.onmove(loc)}catch(ee){console.error(ee)}};main.dom.data.onmouseup=function(e){try{var loc=core.actions._getClickLoc(e.clientX,e.clientY);if(loc==null)return;core.onup(loc)}catch(ee){console.error(ee)}};main.dom.data.onmousewheel=function(e){try{if(e.wheelDelta)core.onmousewheel(Math.sign(e.wheelDelta));else if(e.detail)core.onmousewheel(Math.sign(e.detail))}catch(ee){console.error(ee)}};main.dom.data.ontouchstart=function(e){try{e.preventDefault();var loc=core.actions._getClickLoc(e.targetTouches[0].clientX,e.targetTouches[0].clientY);if(loc==null)return;main.lastTouchLoc=loc;core.ondown(loc)}catch(ee){console.error(ee)}};main.dom.data.ontouchmove=function(e){try{e.preventDefault();var loc=core.actions._getClickLoc(e.targetTouches[0].clientX,e.targetTouches[0].clientY);if(loc==null)return;main.lastTouchLoc=loc;core.onmove(loc)}catch(ee){console.error(ee)}};main.dom.data.ontouchend=function(e){try{e.preventDefault();if(main.lastTouchLoc==null)return;var loc=main.lastTouchLoc;delete main.lastTouchLoc;core.onup(loc)}catch(e){console.error(e)}};main.statusBar.image.book.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.triggerReplay();return}if(core.isPlaying())core.openBook(true)};main.statusBar.image.fly.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.stopReplay();return}if(core.isPlaying()){if(!core.flags.equipboxButton){core.useFly(true)}else{core.openEquipbox(true)}}};main.statusBar.image.toolbox.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.rewindReplay();return}if(core.isPlaying()){core.openToolbox(core.status.event.id!="equipbox")}};main.statusBar.image.toolbox.ondblclick=function(e){e.stopPropagation();if(core.isReplaying()){return}if(core.isPlaying())core.openEquipbox(true)};main.statusBar.image.keyboard.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.control._replay_book();return}if(core.isPlaying())core.openKeyBoard(true)};main.statusBar.image.shop.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.control._replay_viewMap();return}if(core.isPlaying())core.openQuickShop(true)};main.statusBar.image.money.onclick=function(e){e.stopPropagation();if(core.isPlaying())core.openQuickShop(true)};main.statusBar.image.floor.onclick=function(e){e.stopPropagation();if(core&&core.isPlaying()&&!core.isMoving()&&!core.status.lockControl){core.ui._drawViewMaps()}};main.statusBar.image.save.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.speedDownReplay();return}if(core.isPlaying())core.save(true)};main.statusBar.image.load.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.speedUpReplay();return}if(core.isPlaying())core.load(true)};main.statusBar.image.settings.onclick=function(e){e.stopPropagation();if(core.isReplaying()){core.control._replay_SL();return}if(core.isPlaying())core.openSettings(true)};main.dom.hard.onclick=function(){core.control.setToolbarButton(!core.domStyle.toolbarBtn)};main.statusBar.image.btn1.onclick=function(e){e.stopPropagation();core.onkeyUp({keyCode:49,altKey:core.getLocalStorage("altKey")})};main.statusBar.image.btn2.onclick=function(e){e.stopPropagation();core.onkeyUp({keyCode:50,altKey:core.getLocalStorage("altKey")})};main.statusBar.image.btn3.onclick=function(e){e.stopPropagation();core.onkeyUp({keyCode:51,altKey:core.getLocalStorage("altKey")})};main.statusBar.image.btn4.onclick=function(e){e.stopPropagation();core.onkeyUp({keyCode:52,altKey:core.getLocalStorage("altKey")})};main.statusBar.image.btn5.onclick=function(e){e.stopPropagation();core.onkeyUp({keyCode:53,altKey:core.getLocalStorage("altKey")})};main.statusBar.image.btn6.onclick=function(e){e.stopPropagation();core.onkeyUp({keyCode:54,altKey:core.getLocalStorage("altKey")})};main.statusBar.image.btn7.onclick=function(e){e.stopPropagation();core.onkeyUp({keyCode:55,altKey:core.getLocalStorage("altKey")})};main.statusBar.image.btn8.onclick=function(e){e.stopPropagation();if(core.getLocalStorage("altKey")){core.removeLocalStorage("altKey");core.drawTip("Alt\u6A21\u5F0F\u5DF2\u5173\u95ED\u3002");main.statusBar.image.btn8.style.filter=""}else{core.setLocalStorage("altKey",true);core.drawTip("Alt\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF1B\u6B64\u6A21\u5F0F\u4E0B1~7\u6309\u94AE\u89C6\u4E3AAlt+1~7\u3002");main.statusBar.image.btn8.style.filter="sepia(1) contrast(1.5)"}};window.onblur=function(){if(core&&core.control){try{core.control.checkAutosave()}catch(e){}}};main.dom.inputYes.onclick=function(){main.dom.inputDiv.style.display="none";var func=core.platform.successCallback;core.platform.successCallback=core.platform.errorCallback=null;if(func)func(main.dom.inputBox.value)};main.dom.inputNo.onclick=function(){main.dom.inputDiv.style.display="none";var func=core.platform.errorCallback;core.platform.successCallback=core.platform.errorCallback=null;if(func)func(null)}};var main=new main;