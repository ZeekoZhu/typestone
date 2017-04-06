class ExpressionParser {
    constructor(
        public contextModel: Object
    ) { }


    parse(template: string) {
        let matches: RegExpExecArray;
        let subBeginIndex = 0;
        let syntaxElements: string[] = [];
        while ((matches = Expression.BinaryPattern.exec(template)) !== null) {
            syntaxElements.push(template.substring(subBeginIndex, Expression.BinaryPattern.lastIndex - matches[0].length).trim());
            syntaxElements.push(matches[0].trim());
            subBeginIndex = Expression.BinaryPattern.lastIndex;
        }
        syntaxElements.push(template.substring(subBeginIndex, template.length).trim());

        return Expression.from(syntaxElements);
    }
}



class Expression {
    static BinaryPattern = /[\+\-\*\/]|\|\||\?\?/g;
    static ConstrantPattern = /^null|false|true|'.*?'|[\-\+]?\d+(\.\d+)*$/g;

    /**
     * 缓存表达式正则匹配模式
     */
    private static _patterns: Array<{ pattern: RegExp, name: string }>;
    /**
     * 获取所有的表达式正则匹配模式
     */
    static get patterns() {
        let result: Array<{ pattern: RegExp, name: string }> = Expression._patterns || [];
        // 缓存判断
        if (result.length) {
            return result;
        }
        let methodReg = /\w+(?=Pattern$)/g;
        for (let key in Expression) {
            let methodName = key.match(methodReg);
            if (methodName) {
                result.push({ pattern: Expression[key], name: methodName[0] + 'Expression' });
            }
        }
        return result;
    }

    /**
     * 将词法元素转换为 Expression
     * @static
     * @param {string[]} syntaxElements 词法元素
     * @returns
     *
     * @memberOf Expression
     */
    static from(syntaxElements: string[]) {
        let expressions: Expression[] = [];
        syntaxElements.forEach(str => {
            Expression.patterns.filter(p => p.pattern.test(str)).map(p => new window[p.name](str)).forEach(exp => expressions.push(exp));
        });

        let expResStack: Expression[] = [];
        let operatorStack: Expression[] = [];

    }
}

class BinaryExpression extends Expression {
    left: Expression;
    right: Expression;
    constructor(
        public operator: string
    ) {
        super();
    }
}

class ConstrantExpression extends Expression {

    constructor(
        public content: string) {
        super();
    }
}