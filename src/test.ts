/// <reference path="./linq.ts" />


class Model {
    public Template: Element;
    public Result: Element;
    public Watchers: Watcher[];



    constructor(private selector: string) {
        this.Watchers = [];
        this.Template = document.querySelector(selector);
        let temp = document.createDocumentFragment();
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
    static ConvertToHtml(element: Node, deep: boolean = true) {
        let ele = document.createElement('div');
        ele.appendChild(element.cloneNode(deep));
        return ele.innerHTML;
    }

    private static DetectTemplate(target: Node) {
        let result = new Array<DetectTemplateResult>();
        // let tmp: DetectTemplateResult = ;
        let templateReg = /\{\{\w+\}\}/g;
        switch (target.nodeType) {
            // 对于文本节点检查文本内容
            case Node.TEXT_NODE:
                let tmp = (target.nodeValue.match(templateReg) || [])
                    .map(str => new DetectTemplateResult(str.substring(2, str.length - 2), '*text', target.nodeValue));
                if (tmp && tmp.length > 0) {
                    result.push(...tmp);
                }
                break;
            // 对于元素节点，检查 attributes
            case Node.ELEMENT_NODE:
                for (let i = 0; i < target.attributes.length; i++) {
                    let attr = target.attributes[i];
                    let tmp = (attr.value.match(templateReg) || [])
                        .map(str => new DetectTemplateResult(str.substring(2, str.length - 2), attr.nodeName, attr.value));
                    if (tmp && tmp.length > 0) {
                        result.push(...tmp);
                    }
                }
                break;
        }
        return result;
    }



	/**
	 * 给模板加上监听器的函数
	 *
	 * 遍历 Node 中的所有的特性和文本节点
	 *
	 * @param {Node} template 模板对象
	 */
    AddWatcher(target: Node) {
        if (target === null) {
            return;
        }
        let currentNode = target;

        let templates = Model.DetectTemplate(target);
        if (templates.length > 0) {
            templates.forEach(t => {
                // 检查是否对此属性设置了监视器
                let watcher = this.Watchers.FirstOrDefault(w => w.propertyKey === t.propKey) || new Watcher();
                if (watcher.elements.length === 0) {
                    // 没有设置，就新建一个监视器
                    this.Watchers.push(watcher);
                }
                watcher.propertyKey = t.propKey;
                let watched = watcher.elements.FirstOrDefault(e => e.element === currentNode);
                // 检查是否对当前结点设置了监视器
                if (!watched) {
                    // 没有设置，就新建一个监视器
                    watched = {
                        element: currentNode as Element,
                        templates: {}
                    };
                    watcher.elements.push(watched);
                };
                // 为此节点添加模板
                watched.templates[t.templateKey] = t.templateStr;
            });
        }

        this.AddWatcher(currentNode.nextSibling);
        this.AddWatcher(currentNode.firstChild);
    }
}

class DetectTemplateResult {

    constructor(
        public propKey: string,
        public templateKey: string,
        public templateStr: string
    ) { }
}


/**
 * Data 特性
 *
 * @param {*} target
 * @param {string} key
 */
function Data(target: any, key: string) {
    let model = this as Model;

    let _val = model[key];
    let getter = function () {
        console.log(`Get: ${key} => ${_val}`);
        return _val;
    };

    // property setter
    let setter = function (newVal) {
        console.log(`Set: ${key} => ${newVal}`);
        _val = newVal;
        let _this = this as Model;
        if (!_this.Watchers) {
            return;
        }
        let watcher = _this.Watchers.FirstOrDefault((value) => {
            return value.propertyKey === key;
        });
        if (!watcher) {
            return;
        } else {
            if (watcher.currentValue === newVal) {
                console.log('same');
                return;
            } else {
                watcher.currentValue = newVal;
            }
            watcher.elements.forEach((value, index) => {
                let templates = watcher.elements[index].templates;
                for (let key in templates) {
                    if (templates.hasOwnProperty(key)) {
                        let template = templates[key];
                        let result = Stone(template, _this);
                        if (key === '*text') {
                            value.element.textContent = result;
                        } else {
                            value.element.setAttribute(key, result);
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

class Watcher {
    public currentValue: string | number;
    public propertyKey: string;
    public elements: WatchedElement[] = [];

    public Update(value: string | number) {
        if (value === this.currentValue) {
            return;
        }
        else {
            console.log(`update ${this.propertyKey} from ${this.currentValue} to ${value}`);
        }
    }
}

class WatchedElement {
    element: Element;
    templates: any = {};
}



class MyModel extends Model {
    @Data Name: string;
    @Data Age: number;
}

let test = new MyModel('#test');
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
function Stone(templateStr: string, dataObj: any) {

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

    let temps = templateStr.match(/\{\{\w+\}\}/g);
    for (let temp in temps) {
        if (temps.hasOwnProperty(temp)) {
            let tempReduce = getTempName(temps[temp]);
            let tempValue = getValueByName(tempReduce, dataObj);
            templateStr = templateStr.replace(temps[temp], tempValue);
        }

    }
    return templateStr;
}


