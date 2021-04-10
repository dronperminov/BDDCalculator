const NOT = "¬"
const AND = "∧"
const OR = "∨"
const XOR = "⊕"
const SHEFFER = "|"
const PIRS = "↓"
const IMPL = "→"
const EQUAL = "≡"

const ONE = "1"
const ZERO = "0"

function LogicalCalculator(expression) {
    this.expression = expression // удаляем из выражения пробельные символы

    this.InitOperators() // инциализируем операции
    this.InitConstants() // инициализируем константы
    this.InitReplacements()
    this.InitRegExp() // инициализируем регулярное выражение
    this.SplitToLexemes() // разбиваем на лексемы
    this.ConvertToRPN() // получаем польскую запись
}

// инициализация операций
LogicalCalculator.prototype.InitOperators = function() {
    this.operators = {}

    this.operators[AND] = function(x, y) { return x && y }
    this.operators[OR] = function(x, y) { return x || y }
    this.operators[XOR] = function(x, y) { return x == y ? 0 : 1 }
    this.operators[EQUAL] = function(x, y) { return x == y ? 1 : 0 }
    this.operators[IMPL] = function(x, y) { return (1 - x) || y }
    this.operators[PIRS] = function(x, y) { return (1 - x) && (1 - y) }
    this.operators[SHEFFER] = function(x, y) { return (1 - x) || (1 - y) }
}

// инициализация констант
LogicalCalculator.prototype.InitConstants = function() {
    this.constants = {}

    this.constants["ZERO"] = 0
    this.constants["ONE"] = 1
}

// инициализация правил замены
LogicalCalculator.prototype.InitReplacements = function() {
    this.replacementRules = [
        ["<->", EQUAL],
        ["==", EQUAL],
        ["=", EQUAL],
        ["->", IMPL],
        ["+", OR],
        ["||", OR],
        ["↑", SHEFFER],
        ["*", AND],
        ["&", AND],
        ["^", XOR],
        ["!", NOT],
        ["-", NOT],
        ["~", NOT],
    ]
}

// инициализация регулярного выражения
LogicalCalculator.prototype.InitRegExp = function() {
    let number = "1|0" // вещественные числа
    let operators = Object.keys(this.operators).map(function(x) { return x.length == 1 ? "\\" + x : x }).join("|") // операции
    let constants = Object.keys(this.constants).join("|") // константы
    let variables = "[a-z][a-z\\d]*" // переменные

    let parts = [ number, "\\(|\\)|\\¬", operators, constants, variables, ","]

    this.regexp = new RegExp(parts.join("|"), "gi")
}

// парсинг на лексемы с проверкой на корректность
LogicalCalculator.prototype.SplitToLexemes = function() {
    for (let i = 0; i < this.replacementRules.length; i++) {
        let from = this.replacementRules[i][0]
        let to = this.replacementRules[i][1]

        while (this.expression.indexOf(from) > -1)
            this.expression = this.expression.replace(from, to)
    }

    this.lexemes = this.expression.match(this.regexp) // разбиваем на лексемы

    if (this.lexemes.join("") != this.expression.replace(/\s/g, "")) // если выражения не совпадают
        throw "Unknown characters in expression"; // значит есть некорректные символы
}

// проверка на операцию
LogicalCalculator.prototype.IsOperator = function(lexeme) {
    return lexeme in this.operators
}

// проверка на константу
LogicalCalculator.prototype.IsConstant = function(lexeme) {
    return lexeme in this.constants
}

// проверка на число
LogicalCalculator.prototype.IsNumber = function(lexeme) {
    return lexeme == ZERO || lexeme == ONE
}

// проверка на переменную
LogicalCalculator.prototype.IsVariable = function(lexeme) {
    return lexeme.match(/^([a-z][a-z\d]*)/gi) != null
}

// получение приоритета операции
LogicalCalculator.prototype.GetPriority = function(lexeme) {
    if (lexeme == NOT)
        return 7

    if (lexeme == AND)
        return 6

    if (lexeme == OR || lexeme == XOR)
        return 5

    if (lexeme == SHEFFER)
        return 4

    if (lexeme == PIRS)
        return 3

    if (lexeme == IMPL)
        return 2

    if (lexeme == EQUAL)
        return 1

    return 0
}

// проверка, что текущая лексема менее приоритетна лексемы на вершине стека
LogicalCalculator.prototype.IsMorePriority = function(curr, top) {
    if (curr == NOT)
        return this.GetPriority(top) > this.GetPriority(curr)

    return this.GetPriority(top) >= this.GetPriority(curr)
}

// получение польской записи
LogicalCalculator.prototype.ConvertToRPN = function() {
    this.rpn = []
    this.variables = {}
    let stack = []

    for (let lexeme of this.lexemes.values()) {
        if (this.IsNumber(lexeme) || this.IsConstant(lexeme)) {
            this.rpn.push(lexeme)
        }
        else if (this.IsOperator(lexeme) || lexeme == NOT) {
            while (stack.length > 0 && this.IsMorePriority(lexeme, stack[stack.length - 1]))
                this.rpn.push(stack.pop())

            stack.push(lexeme)
        }
        else if (this.IsVariable(lexeme)) {
            this.rpn.push(lexeme)
            this.variables[lexeme] = 0
        }
        else if (lexeme == ",") {
            while (stack.length > 0 && stack[stack.length - 1] != "(")
                this.rpn.push(stack.pop())

            if (stack.length == 0)
                throw "Incorrect expression"
        }
        else if (lexeme == "(") {
            stack.push(lexeme)
        }
        else if (lexeme == ")") {
            while (stack.length > 0 && stack[stack.length - 1] != "(")
                this.rpn.push(stack.pop())

            if (stack.length == 0)
                throw "Incorrect expression: brackets are disbalanced"

            stack.pop()
        }
        else
            throw "Incorrect expression: unknown lexeme '" + lexeme + "'"
    }

    while (stack.length > 0) {
        if (stack[stack.length - 1] == "(")
            throw "Incorrect expression: brackets are disbalanced"

        this.rpn.push(stack.pop())
    }
}

// обновление значения переменной
LogicalCalculator.prototype.SetValue = function(name, value) {
    this.variables[name] = value
}

// вычисление выражения
LogicalCalculator.prototype.Evaluate = function() {
    let stack = []

    for (let lexeme of this.rpn.values()) {
        if (this.IsOperator(lexeme)) {
            if (stack.length < 2)
                throw "Unable to evaluate operator '" + lexeme + "'"

            let arg2 = stack.pop()
            let arg1 = stack.pop()

            stack.push(this.operators[lexeme](arg1, arg2))
        }
        else if (lexeme == NOT) {
            if (stack.length < 1)
                throw "Unable to evaluate unary minus"

            stack.push(1 - stack.pop())
        }
        else if (this.IsConstant(lexeme)) {
            stack.push(this.constants[lexeme])
        }
        else if (this.IsVariable(lexeme)) {
            stack.push(this.variables[lexeme])
        }
        else if (this.IsNumber(lexeme)) {
            stack.push(+lexeme)
        }
        else
            throw "Unknown rpn lexeme '" + lexeme + "'"
    }

    if (stack.length != 1)
        throw "Incorrect expression"

    return stack[0]
}

// перевод выражения в польской записи в строку
LogicalCalculator.prototype.ToStringRPN = function(rpn) {
    let stack = []
    let priorities = []

    for (let lexeme of rpn.values()) {
        if (this.IsOperator(lexeme)) {
            let arg2 = stack.pop()
            let arg1 = stack.pop()

            let priority2 = priorities.pop()
            let priority1 = priorities.pop()
            let priority = this.GetPriority(lexeme)

            if (priority > priority1 && priority1 > 0)
                arg1 = `(${arg1})`

            if (priority > priority2 && priority2 > 0)
                arg2 = `(${arg2})`

            stack.push(`${arg1} ${lexeme} ${arg2}`)
            priorities.push(this.GetPriority(lexeme))
        }
        else if (lexeme == NOT) {
            let arg = stack.pop()
            let priority = priorities.pop()

            if (priority > 0)
                arg = `(${arg})`

            stack.push(`¬${arg}`)
            priorities.push(priority)
        }
        else if (this.IsConstant(lexeme)) {
            stack.push(`${this.constants[lexeme]}`)
            priorities.push(this.GetPriority(lexeme))
        }
        else if (this.IsVariable(lexeme)) {
            stack.push(`${lexeme}`)
            priorities.push(this.GetPriority(lexeme))
        }
        else if (this.IsNumber(lexeme)) {
            stack.push(`${lexeme}`)
            priorities.push(this.GetPriority(lexeme))
        }
        else
            throw "Unknown rpn lexeme '" + lexeme + "'"
    }

    return stack[0]
}

// перевод выражения в строку
LogicalCalculator.prototype.ToString = function() {
    return this.ToStringRPN(this.rpn)
}

// получение переменных дерева
LogicalCalculator.prototype.GetTreeVariablesRecursive = function(node, variables) {
    if (node == null)
        return

    if (this.IsVariable(node.value) && variables.indexOf(node.value) == -1)
        variables.push(node.value)

    this.GetTreeVariablesRecursive(node.arg1, variables)
    this.GetTreeVariablesRecursive(node.arg2, variables)
}

// получение переменных дерева
LogicalCalculator.prototype.GetTreeVariables = function(tree) {
    let variables = []
    this.GetTreeVariablesRecursive(tree, variables)
    return variables
}

// вычисление на дереве
LogicalCalculator.prototype.EvaluateTree = function(node, variables) {
    if (this.IsNumber(node.value))
        return +node.value

    if (this.IsConstant(node.value))
        return this.constants[node.value]

    if (this.IsVariable(node.value))
        return variables[node.value]

    if (this.IsOperator(node.value)) {
        let arg1 = this.EvaluateTree(node.arg1, variables)
        let arg2 = this.EvaluateTree(node.arg2, variables)
        return this.operators[node.value](arg1, arg2)
    }

    if (node.value == NOT)
        return 1 - this.EvaluateTree(node.arg1, variables)

    throw node
}

// проверка двух деревьев на эквивалентность путём проверки реализуемых функций
LogicalCalculator.prototype.IsTreesEqualNumerical = function(node1, node2) {
    let variables1 = this.GetTreeVariables(node1)
    let variables2 = this.GetTreeVariables(node2)
    let variables = {}

    for (let variable of variables1.values())
        variables[variable] = 0

    for (let variable of variables2.values())
        variables[variable] = 0

    let names = Object.keys(variables)

    if (names.length == 0)
        return this.EvaluateTree(node1, variables) == this.EvaluateTree(node2, variables)

    let n = names.length
    let total = 1 << n

    for (let i = 0; i < total; i++) {
        for (let j = 0; j < n; j++)
            variables[names[j]] = (i >> j) & 1

        let value1 = this.EvaluateTree(node1, variables)
        let value2 = this.EvaluateTree(node2, variables)

        if (value1 != value2)
            return false
    }

    return true
}

// проверка двух деревьев на эквивалентность
LogicalCalculator.prototype.IsTreesEqual = function(node1, node2) {
    if (this.IsTreesEqualNumerical(node1, node2))
        return true

    if (node1 == null && node2 == null)
        return true

    if (node1 == null || node2 == null)
        return false

    if (node1.value != node2.value)
        return false

    return this.IsTreesEqual(node1.arg1, node2.arg1) && this.IsTreesEqual(node1.arg2, node2.arg2)
}

// формирование узла дерева
LogicalCalculator.prototype.MakeNode = function(value, arg1 = null, arg2 = null) {
    return {value: value, arg1: arg1, arg2: arg2}
}

// упрощение дерева для отрицания
LogicalCalculator.prototype.SimplifyTreeNot = function(node) {
    if (node.arg1.value == ONE )
        return this.MakeNode(ZERO)

    if (node.arg1.value == ZERO )
        return this.MakeNode(ONE)

    return node
}

// упрощение дерева для конъюнкции
LogicalCalculator.prototype.SimplifyTreeAnd = function(node) {
    if (node.arg1.value == ZERO || node.arg2.value == ZERO)
        return this.MakeNode(ZERO)

    if (node.arg1.value == ONE)
        return node.arg2

    if (node.arg2.value == ONE)
        return node.arg1

    if (this.IsTreesEqual(node.arg1, node.arg2))
        return node.arg1

    return node
}

// упрощение дерева для дизъюнкции
LogicalCalculator.prototype.SimplifyTreeOr = function(node) {
    if (node.arg1.value == ONE || node.arg2.value == ONE)
        return this.MakeNode(ONE)

    if (node.arg1.value == ZERO)
        return node.arg2

    if (node.arg2.value == ZERO)
        return node.arg1

    if (this.IsTreesEqual(node.arg1, node.arg2))
        return node.arg1

    return node
}

// упрощение дерева для исключающего или
LogicalCalculator.prototype.SimplifyTreeXor = function(node) {
    if (node.arg1.value == ZERO)
        return node.arg2

    if (node.arg2.value == ZERO)
        return node.arg1

    if (node.arg1.value == ONE && node.arg2.value == ONE)
        return this.MakeNode(ZERO)

    if (node.arg1.value == ONE)
        return this.MakeNode(NOT, node.arg2)

    if (node.arg2.value == ONE)
        return this.MakeNode(NOT, node.arg1)

    if (this.IsTreesEqual(node.arg1, node.arg2))
        return this.MakeNode(ZERO)

    return node
}

// упрощение дерева для штриха Шеффера
LogicalCalculator.prototype.SimplifyTreeSheffer = function(node) {
    if (node.arg1.value == ZERO || node.arg2.value == ZERO)
        return this.MakeNode(ONE)

    if (node.arg1.value == ONE && node.arg2.value == ONE)
        return this.MakeNode(ZERO)

    if (node.arg1.value == ONE)
        return this.MakeNode(NOT, node.arg2)

    if (node.arg2.value == ONE)
        return this.MakeNode(NOT, node.arg1)

    if (this.IsTreesEqual(node.arg1, node.arg2))
        return this.MakeNode(NOT, node.arg1)

    return node
}

// упрощение дерева для стрелки Пирса
LogicalCalculator.prototype.SimplifyTreePirs = function(node) {
    if (node.arg1.value == ONE || node.arg2.value == ONE)
        return this.MakeNode(ZERO)

    if (node.arg1.value == ZERO && node.arg2.value == ZERO)
        return this.MakeNode(ONE)

    if (node.arg1.value == ZERO)
        return this.MakeNode(NOT, node.arg2)

    if (node.arg2.value == ZERO)
        return this.MakeNode(NOT, node.arg1)

    if (this.IsTreesEqual(node.arg1, node.arg2))
        return this.MakeNode(NOT, node.arg1)

    return node
}

// упрощение дерева для импликации
LogicalCalculator.prototype.SimplifyTreeImpl = function(node) {
    if (node.arg1.value == ZERO || node.arg2.value == ONE)
        return this.MakeNode(ONE)

    if (node.arg1.value == ONE)
        return node.arg2

    if (node.arg2.value == ZERO)
        return node.arg1

    if (this.IsTreesEqual(node.arg1, node.arg2))
        return this.MakeNode(ONE)

    return node
}

// упрощение дерева для эквивалентности
LogicalCalculator.prototype.SimplifyTreeEqual = function(node) {
    if (node.arg1.value == ONE && node.arg2.value == ONE)
        return this.MakeNode(ONE)

    if (node.arg1.value == ZERO && node.arg2.value == ZERO)
        return this.MakeNode(ONE)

    if (this.IsTreesEqual(node.arg1, node.arg2))
        return this.MakeNode(ONE)

    return node
}

// упрощение путём подбора пары элементарных функций 0, 1 и 2 переменных
LogicalCalculator.prototype.SimplifyByElementaryFunctions = function(node) {
    let variables = this.GetTreeVariables(node)

    if (variables.length == 0)
        return this.MakeNode(this.EvaluateTree(node, {}) + "")

    if (this.IsTreesEqual(node, this.MakeNode(ZERO)))
        return this.MakeNode(ZERO)

    if (this.IsTreesEqual(node, this.MakeNode(ONE)))
        return this.MakeNode(ONE)

    // проверка на переменную или её отрицание
    for (let variable of variables) {
        let arg = this.MakeNode(variable)

        if (this.IsTreesEqual(node, arg))
            return arg

        let f = this.MakeNode(NOT, arg)

        if (this.IsTreesEqual(node, f))
            return f
    }

    // проверка на одну из функций от двух аргументов
    for (let variable1 of variables) {
        for (let variable2 of variables) {
            if (variable1 == variable2)
                continue

            let arg1 = this.MakeNode(variable1)
            let arg2 = this.MakeNode(variable2)

            for (let op of [AND, OR, EQUAL, XOR, IMPL]) {
                let f = this.MakeNode(op, arg1, arg2)

                if (this.IsTreesEqual(node, f))
                    return f
            }
        }
    }

    for (let variable1 of variables) {
        for (let variable2 of variables) {
            if (variable1 == variable2)
                continue

            let arg1 = this.MakeNode(NOT, this.MakeNode(variable1))
            let arg2 = this.MakeNode(NOT, this.MakeNode(variable2))

            for (let op of [AND, OR, EQUAL, XOR, IMPL]) {
                let f = this.MakeNode(op, arg1, arg2)

                if (this.IsTreesEqual(node, f))
                    return f
            }
        }
    }

    return node
}

// упрощение дерева
LogicalCalculator.prototype.SimplifyTree = function(node) {
    if (node == null)
        return node

    // упрощаем всё уровнями ниже
    node.arg1 = this.SimplifyTree(node.arg1)
    node.arg2 = this.SimplifyTree(node.arg2)
    node = this.SimplifyByElementaryFunctions(node)

    if (node.value == NOT)
        return this.SimplifyTreeNot(node)

    if (!this.IsOperator(node.value)) // если не оператор
        return node // то не упрощаем

    if (node.value == AND)
        return this.SimplifyTreeAnd(node)

    if (node.value == OR)
        return this.SimplifyTreeOr(node)

    if (node.value == XOR)
        return this.SimplifyTreeXor(node)

    if (node.value == SHEFFER)
        return this.SimplifyTreeSheffer(node)

    if (node.value == PIRS)
        return this.SimplifyTreePirs(node)

    if (node.value == IMPL)
        return this.SimplifyTreeImpl(node)

    if (node.value == EQUAL)
        return this.SimplifyTreeEqual(node)

    return node
}

// формирование дерева выражения по польской записи
LogicalCalculator.prototype.MakeTree = function(rpn, needSimplify = true) {
    let tree = null
    let stack = []

    for (let lexeme of rpn.values()) {
        if (this.IsOperator(lexeme)) {
            let arg2 = stack.pop()
            let arg1 = stack.pop()

            stack.push(this.MakeNode(lexeme, arg1, arg2))
        }
        else if (lexeme == NOT) {
            if (stack.length < 1)
                throw "Unable to evaluate unary minus"

            stack.push(this.MakeNode(lexeme, stack.pop()))
        }
        else if (this.IsConstant(lexeme) || this.IsVariable(lexeme) || this.IsNumber(lexeme)) {
            stack.push(this.MakeNode(lexeme))
        }
        else
            throw "Unknown rpn lexeme '" + lexeme + "'"
    }

    if (needSimplify)
        return this.SimplifyTree(stack[0])

    return stack[0]
}

// перевод из дерева в польскую запись
LogicalCalculator.prototype.TreeToRpnRecursive = function(node, rpn) {
    if (node == null)
        return

    this.TreeToRpnRecursive(node.arg1, rpn)
    this.TreeToRpnRecursive(node.arg2, rpn)
    rpn.push(node.value)
}

// перевод из дерева в польскую запись
LogicalCalculator.prototype.TreeToRpn = function(tree) {
    let rpn = []
    this.TreeToRpnRecursive(tree, rpn)
    return rpn
}