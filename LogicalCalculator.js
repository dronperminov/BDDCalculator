function LogicalCalculator(expression) {
    this.expression = expression.toLowerCase() // удаляем из выражения пробельные символы

    this.InitFunctions() // инциализируем функции
    this.InitBinaryFunctions() // инициализируем бинарные функции
    this.InitOperators() // инциализируем операции
    this.InitConstants() // инициализируем константы
    this.InitReplacements()
    this.InitRegExp() // инициализируем регулярное выражение
    this.SplitToLexemes() // разбиваем на лексемы
    this.ConvertToRPN() // получаем польскую запись
}

// инициализация функций
LogicalCalculator.prototype.InitFunctions = function() {
    this.functions = {}

    this.functions["not"] = function(x) { return 1 - x }
}

// инициализация бинарных функций
LogicalCalculator.prototype.InitBinaryFunctions = function() {
    this.binaryFunctions = {}

    this.binaryFunctions["and"] = function(x, y) { return x && y }
    this.binaryFunctions["xor"] = function(x, y) { return x == y ? 0 : 1 }
    this.binaryFunctions["or"] = function(x, y) { return x || y }
    this.binaryFunctions["eq"] = function(x, y) { return x == y ? 1 : 0 }
    this.binaryFunctions["impl"] = function(x, y) { return (1 - x) || y }
}

// инициализация операций
LogicalCalculator.prototype.InitOperators = function() {
    this.operators = {}

    this.operators["∧"] = function(x, y) { return x && y }
    this.operators["∨"] = function(x, y) { return x || y }
    this.operators["⊕"] = function(x, y) { return x == y ? 0 : 1 }
    this.operators["≡"] = function(x, y) { return x == y ? 1 : 0 }
    this.operators["→"] = function(x, y) { return (1 - x) || y }
    this.operators["↓"] = function(x, y) { return (1 - x) && (1 - y) }
    this.operators["|"] = function(x, y) { return (1 - x) || (1 - y) }
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
        ["<->", "≡"],
        ["==", "≡"],
        ["=", "≡"],
        ["->", "→"],
        ["+", "∨"],
        ["||", "∨"],
        ["↑", "|"],
        ["*", "∧"],
        ["&", "∧"],
        ["^", "⊕"],
        ["!", "¬"],
        ["-", "¬"],
        ["~", "¬"],
    ]
}

// инициализация регулярного выражения
LogicalCalculator.prototype.InitRegExp = function() {
    let number = "1|0" // вещественные числа
    let operators = Object.keys(this.operators).map(function(x) { return x.length == 1 ? "\\" + x : x }).join("|") // операции
    let functions = Object.keys(this.functions).join("|") // функции
    let binaryFunctions = Object.keys(this.binaryFunctions).join("|") // бинарные функции
    let constants = Object.keys(this.constants).join("|") // константы
    let variables = "[a-z][a-z\\d]*" // переменные

    let parts = [ number, "\\(|\\)|\\¬", operators, functions, binaryFunctions, constants, variables, ","]

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

// проверка на функцию
LogicalCalculator.prototype.IsFunction = function(lexeme) {
    return lexeme in this.functions
}

// проверка на бинарную функцию
LogicalCalculator.prototype.IsBinaryFunction = function(lexeme) {
    return lexeme in this.binaryFunctions
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
    return lexeme.match(/^(\d+\.\d+|\d+)$/gi) != null
}

// проверка на переменную
LogicalCalculator.prototype.IsVariable = function(lexeme) {
    return lexeme.match(/^([a-z][a-z\d]*)/gi) != null
}

// получение приоритета операции
LogicalCalculator.prototype.GetPriority = function(lexeme) {
    if (this.IsFunction(lexeme) || this.IsBinaryFunction(lexeme))
        return 8

    if (lexeme == "¬")
        return 7

    if (lexeme == "∧")
        return 6

    if (lexeme == "∨" || lexeme == "⊕")
        return 5

    if (lexeme == "↑")
        return 4

    if (lexeme == "↓")
        return 3

    if (lexeme == "→")
        return 2

    if (lexeme == "≡")
        return 1

    return 0
}

// проверка, что текущая лексема менее приоритетна лексемы на вершине стека
LogicalCalculator.prototype.IsMorePriority = function(curr, top) {
    if (curr == "¬")
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
        else if (this.IsFunction(lexeme) || this.IsBinaryFunction(lexeme)) {
            stack.push(lexeme)
        }
        else if (this.IsOperator(lexeme) || lexeme == "¬") {
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

            if (stack.length > 0 && this.IsFunction(stack[stack.length - 1]))
                this.rpn.push(stack.pop())
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
        else if (this.IsFunction(lexeme)) {
            if (stack.length < 1)
                throw "Unable to evaluate function '" + lexeme + "'"

            let arg = stack.pop()
            stack.push(this.functions[lexeme](arg))
        }
        else if (this.IsBinaryFunction(lexeme)) {
            if (stack.length < 2)
                throw "Unable to evaluate function '" + lexeme + "'"

            let arg2 = stack.pop()
            let arg1 = stack.pop()

            stack.push(this.binaryFunctions[lexeme](arg1, arg2))
        }
        else if (lexeme == "¬") {
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