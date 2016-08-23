// import '../node_modules/reflect-metadata/Reflect.js';
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
        this.Watchers = new Array();
        this.Template = document.querySelector(selector);
        var temp = document.createDocumentFragment();
        temp.appendChild(this.Template.cloneNode(true));
        this.AddWatcher(this.Template.firstChild);
        // this.MarkView(this.Template);
        // let temp = Model.ConvertToHtml(this.Template.querySelector('#test'));
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
     * 标记视图
     *
     * @param {Node} template
     */
    Model.prototype.AddWatcher = function (template) {
        if (template === null) {
            return;
        }
        var currentNode = template;
        for (var key in currentNode.attributes) {
            if (currentNode.attributes.hasOwnProperty(key)) {
                var attrValue = currentNode.attributes[key];
                var temp = attrValue.value.match(/\{\{\w+\}\}/g);
                if (temp) {
                    var propKey = temp[0].substring(2, temp[0].length - 2);
                    var watcher = new Watcher();
                    watcher.currentValue = this[propKey];
                    var attrs = {};
                    if (watcher.elements.indexOf(currentNode) < 0) {
                        watcher.elements.push(currentNode);
                        attrs[attrValue.name] = temp[0];
                        watcher.attrs.push(attrs);
                    }
                    else {
                        watcher.attrs[watcher.elements.length - 1][key] = temp[0];
                    }
                    watcher.propertyKey = propKey;
                    this.Watchers.push(watcher);
                }
            }
        }
        this.AddWatcher(currentNode.nextSibling);
        this.AddWatcher(currentNode.firstChild);
        // if(template.nextSibling){
        // 	Model.MarkView(template);
        // }
    };
    Model.HasTemplate = function (node) {
    };
    __decorate([
        Data, 
        __metadata('design:type', String)
    ], Model.prototype, "Name", void 0);
    return Model;
}());
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
                var attrs = watcher[0].attrs[index];
                for (var key_1 in attrs) {
                    if (attrs.hasOwnProperty(key_1)) {
                        var attrValue = attrs[key_1];
                        var result = Stone(attrValue, _this);
                        value.setAttribute(key_1, result);
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
        this.attrs = new Array();
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
