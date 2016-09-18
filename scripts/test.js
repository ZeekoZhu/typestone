// import '../node_modules/reflect-metadata/Reflect.js';
// 上面的注释去掉会出现奇怪的问题
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/// <reference path="./linq.ts" />
var Model = (function () {
    function Model(selector) {
        this.selector = selector;
        this.Watchers = new Array();
        this.Template = document.querySelector(selector);
        var temp = document.createDocumentFragment();
        temp.appendChild(this.Template.cloneNode(true));
        this.AddWatcher(this.Template.firstChild);
    }
    /**
     * 将 node 节点对象转化为 string
     *
     * @param {Node} element 节点对象
     * @param {boolean} [deep=true] 是否转化所有子节点
     * @returns
     */
    Model.ConvertToHtml = function (element, deep) {
        if (deep === void 0) { deep = true; }
        var ele = document.createElement('div');
        ele.appendChild(element.cloneNode(deep));
        return ele.innerHTML;
    };
    /**
     * 给模板加上监听器的函数
     *
     * 遍历 Node 中的所有的特性和文本节点
     *
     * @param {Node} template 模板对象
     */
    Model.prototype.AddWatcher = function (template) {
        var _this = this;
        if (template === null) {
            return;
        }
        var currentNode = template;
        console.log(Model.ConvertToHtml(currentNode, false));
        console.info(currentNode);
        switch (currentNode.nodeType) {
            case 3:
                var content_1 = currentNode.nodeValue;
                var temps = content_1.match(/\{\{\w+\}\}/g);
                if (temps) {
                    temps.forEach(function (temp) {
                        var propKey = temp.substring(2, temp.length - 2);
                        var watcher = _this.Watchers.FirstOrDefault(function (w) {
                            return w.propertyKey === propKey;
                        });
                        var isNew = false;
                        if (watcher == null) {
                            watcher = new Watcher();
                            isNew = true;
                        }
                        var templates = {};
                        if (watcher.elements.indexOf(currentNode) < 0) {
                            watcher.elements.push(currentNode);
                            templates['text'] = content_1;
                            watcher.templates.push(templates);
                        }
                        // else {
                        // 	watcher.templates[watcher.elements.length - 1]["attrValue.name"] = attrValue.value;
                        // }
                        if (isNew) {
                            watcher.propertyKey = propKey;
                            _this.Watchers.push(watcher);
                        }
                    });
                }
        }
        // 首先寻找 attribute 里面的模板哟
        var _loop_1 = function(key) {
            if (currentNode.attributes.hasOwnProperty(key)) {
                var attrValue_1 = currentNode.attributes[key];
                var temps = attrValue_1.value.match(/\{\{\w+\}\}/g);
                if (temps) {
                    temps.forEach(function (temp) {
                        // let temp = temps[index];
                        // 解析属性名
                        var propKey = temp.substring(2, temp.length - 2);
                        // 寻找已经存在的属性监视器
                        var isNew = false;
                        var watcher = _this.Watchers.FirstOrDefault(function (w) {
                            return w.propertyKey === propKey;
                        });
                        if (watcher == null) {
                            watcher = new Watcher();
                            isNew = true;
                        }
                        watcher.currentValue = _this[propKey];
                        // 用来存放属性的对象
                        var attributes = {};
                        // 绑定添加元素监视
                        if (watcher.elements.indexOf(currentNode) < 0) {
                            watcher.elements.push(currentNode);
                            attributes[attrValue_1.name] = attrValue_1.value;
                            watcher.templates.push(attributes);
                        }
                        else {
                            watcher.templates[watcher.elements.length - 1][attrValue_1.name] = attrValue_1.value;
                        }
                        if (isNew) {
                            watcher.propertyKey = propKey;
                            _this.Watchers.push(watcher);
                        }
                    });
                }
            }
        };
        for (var key in currentNode.attributes) {
            _loop_1(key);
        }
        this.AddWatcher(currentNode.nextSibling);
        this.AddWatcher(currentNode.firstChild);
    };
    Model.HasTemplate = function (node) {
    };
    __decorate([
        Data, 
        __metadata('design:type', String)
    ], Model.prototype, "Name", void 0);
    __decorate([
        Data, 
        __metadata('design:type', Number)
    ], Model.prototype, "Age", void 0);
    return Model;
}());
/**
 * Data 特性
 *
 * @param {*} target
 * @param {string} key
 */
function Data(target, key) {
    var model = this;
    var _val = model[key];
    var getter = function () {
        console.log("Get: " + key + " => " + _val);
        return _val;
    };
    // property setter
    var setter = function (newVal) {
        console.log("Set: " + key + " => " + newVal);
        _val = newVal;
        var _this = this;
        if (!_this.Watchers) {
            return;
        }
        var watcher = _this.Watchers.filter(function (value) {
            return value.propertyKey === key;
        });
        if (watcher === null) {
            return;
        }
        else {
            watcher[0].elements.forEach(function (value, index) {
                var templates = watcher[0].templates[index];
                for (var key_1 in templates) {
                    if (templates.hasOwnProperty(key_1)) {
                        var template = templates[key_1];
                        var result = Stone(template, _this);
                        if (key_1 === 'text') {
                            value.textContent = result;
                        }
                        else {
                            value.setAttribute(key_1, result);
                        }
                    }
                }
            });
        }
    };
    // Delete property.
    if (delete this[key]) {
        // Create new property with getter and setter
        Object.defineProperty(target, key, {
            get: getter,
            set: setter,
            enumerable: true,
            configurable: true
        });
    }
}
var Watcher = (function () {
    function Watcher() {
        this.elements = new Array();
        this.templates = new Array();
    }
    Watcher.prototype.Update = function (value) {
        if (value === this.currentValue) {
            return;
        }
        else {
            console.log("update " + this.propertyKey + " from " + this.currentValue + " to " + value);
        }
    };
    return Watcher;
}());
var test = new Model('#test');
test.Name = 'zeeko';
console.log(test);
/**
 * 模板处理函数
 *
 * @param {string} templateStr
 * @param {*} dataObj
 * @returns
 */
function Stone(templateStr, dataObj) {
    function getTempName(tempStr) {
        return tempStr.substring(2, tempStr.length - 2);
    }
    function getValueByName(propertyName, obj) {
        if (obj[propertyName]) {
            return obj[propertyName];
        }
        else {
            return 'NULL';
        }
    }
    var temps = templateStr.match(/\{\{\w+\}\}/g);
    for (var temp in temps) {
        if (temps.hasOwnProperty(temp)) {
            var tempReduce = getTempName(temps[temp]);
            var tempValue = getValueByName(tempReduce, dataObj);
            templateStr = templateStr.replace(temps[temp], tempValue);
        }
    }
    return templateStr;
}
