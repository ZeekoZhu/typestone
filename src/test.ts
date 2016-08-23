// import '../node_modules/reflect-metadata/Reflect.js';

class Model {
	public Template: Element;
	public Result: Element;
	public Watchers: Watcher[];


	@Data
	public Name: string;



	constructor(private selector: string) {
		this.Watchers = new Array<Watcher>()
		this.Template = document.querySelector(selector);
		let temp = document.createDocumentFragment();
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
	static ConvertToHtml(element: Node, deep: boolean = true) {
		let ele = document.createElement('div');
		ele.appendChild(element.cloneNode(deep));
		return ele.innerHTML;
	}

	/**
	 * 标记视图
	 * 
	 * @param {Node} template
	 */
	AddWatcher(template: Node) {
		if (template === null) {
			return;
		}
		let currentNode = template;

		for (let key in currentNode.attributes) {
			if (currentNode.attributes.hasOwnProperty(key)) {
				let attrValue = currentNode.attributes[key];
				let temp = attrValue.value.match(/\{\{\w+\}\}/g);
				if (temp) {
					let propKey = temp[0].substring(2, temp[0].length - 2);
					let watcher = new Watcher();
					watcher.currentValue = this[propKey];
					let attrs = {};

					if (watcher.elements.indexOf(currentNode as Element) < 0) {
						watcher.elements.push(currentNode as Element);
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
	}

	static HasTemplate(node: Node) {

	}
}


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
		let watcher = _this.Watchers.filter((value) => {
			return value.propertyKey === key;
		});
		if (watcher === null) {
			return;
		}
		else {
			watcher[0].elements.forEach((value, index) => {
				let attrs = watcher[0].attrs[index];
				for (let key in attrs) {
					if (attrs.hasOwnProperty(key)) {
						let attrValue = attrs[key];
						let result = Stone(attrValue, _this);
						value.setAttribute(key, result);
					}
				}
			})
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
	public template: string;
	public elements: Element[] = new Array();
	public attrs: any[] = new Array();

	public Update(value: string | number) {
		if (value === this.currentValue) {
			return;
		}
		else {
			console.log(`update ${this.propertyKey} from ${this.currentValue} to ${value}`);
		}
	}
}





let test = new Model('#test');
test.Name = 'zeeko';

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


