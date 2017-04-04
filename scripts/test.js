/// <reference path="./linq.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Model = (function () {
    function Model(selector) {
        this.selector = selector;
        this.Watchers = [];
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
    Model.DetectTemplate = function (target) {
        var result = new Array();
        // let tmp: DetectTemplateResult = ;
        var templateReg = /\{\{\w+\}\}/g;
        switch (target.nodeType) {
            // 对于文本节点检查文本内容
            case Node.TEXT_NODE:
                var tmp = (target.nodeValue.match(templateReg) || [])
                    .map(function (str) { return new DetectTemplateResult(str.substring(2, str.length - 2), '*text', target.nodeValue); });
                if (tmp && tmp.length > 0) {
                    result.push.apply(result, tmp);
                }
                break;
            // 对于元素节点，检查 attributes
            case Node.ELEMENT_NODE:
                var _loop_1 = function (i) {
                    var attr = target.attributes[i];
                    var tmp_1 = (attr.value.match(templateReg) || [])
                        .map(function (str) { return new DetectTemplateResult(str.substring(2, str.length - 2), attr.nodeName, attr.value); });
                    if (tmp_1 && tmp_1.length > 0) {
                        result.push.apply(result, tmp_1);
                    }
                };
                for (var i = 0; i < target.attributes.length; i++) {
                    _loop_1(i);
                }
                break;
        }
        return result;
    };
    /**
     * 给模板加上监听器的函数
     *
     * 遍历 Node 中的所有的特性和文本节点
     *
     * @param {Node} template 模板对象
     */
    Model.prototype.AddWatcher = function (target) {
        var _this = this;
        if (target === null) {
            return;
        }
        var currentNode = target;
        var templates = Model.DetectTemplate(target);
        if (templates.length > 0) {
            templates.forEach(function (t) {
                // 检查是否对此属性设置了监视器
                var watcher = _this.Watchers.FirstOrDefault(function (w) { return w.propertyKey === t.propKey; }) || new Watcher();
                if (watcher.elements.length === 0) {
                    // 没有设置，就新建一个监视器
                    _this.Watchers.push(watcher);
                }
                watcher.propertyKey = t.propKey;
                var watched = watcher.elements.FirstOrDefault(function (e) { return e.element === currentNode; });
                // 检查是否对当前结点设置了监视器
                if (!watched) {
                    // 没有设置，就新建一个监视器
                    watched = {
                        element: currentNode,
                        templates: {}
                    };
                    watcher.elements.push(watched);
                }
                ;
                // 为此节点添加模板
                watched.templates[t.templateKey] = t.templateStr;
            });
        }
        this.AddWatcher(currentNode.nextSibling);
        this.AddWatcher(currentNode.firstChild);
    };
    return Model;
}());
var DetectTemplateResult = (function () {
    function DetectTemplateResult(propKey, templateKey, templateStr) {
        this.propKey = propKey;
        this.templateKey = templateKey;
        this.templateStr = templateStr;
    }
    return DetectTemplateResult;
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
        var watcher = _this.Watchers.FirstOrDefault(function (value) {
            return value.propertyKey === key;
        });
        if (!watcher) {
            return;
        }
        else {
            if (watcher.currentValue === newVal) {
                console.log('same');
                return;
            }
            else {
                watcher.currentValue = newVal;
            }
            watcher.elements.forEach(function (value, index) {
                var templates = watcher.elements[index].templates;
                for (var key_1 in templates) {
                    if (templates.hasOwnProperty(key_1)) {
                        var template = templates[key_1];
                        var result = Stone(template, _this);
                        if (key_1 === '*text') {
                            value.element.textContent = result;
                        }
                        else {
                            value.element.setAttribute(key_1, result);
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
        this.elements = [];
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
var WatchedElement = (function () {
    function WatchedElement() {
        this.templates = {};
    }
    return WatchedElement;
}());
var MyModel = (function (_super) {
    __extends(MyModel, _super);
    function MyModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MyModel;
}(Model));
__decorate([
    Data,
    __metadata("design:type", String)
], MyModel.prototype, "Name", void 0);
__decorate([
    Data,
    __metadata("design:type", Number)
], MyModel.prototype, "Age", void 0);
var test = new MyModel('#test');
test.Name = 'zeeko';
test.Age = 12;
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
