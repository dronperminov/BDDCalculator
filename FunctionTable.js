const LEAF_ONE = "[1]"
const LEAF_ZERO = "[0]"

function FunctionTable(expression) {
    this.calculator = new LogicalCalculator(expression)
    this.expression = this.calculator.expression
    this.variables = this.calculator.variables

    let func = this.CalculateFunction()
    this.values = func.values
    this.vector = func.vector
}

// правка заданных переменных
FunctionTable.prototype.FixVariables = function(variablesNames) {
    let variables = Object.keys(this.calculator.variables)
    let extra = []
    let forgotten = []

    for (let i = 0; i < variables.length; i++)
        if (variablesNames.indexOf(variables[i]) == -1)
            forgotten.push(variables[i])

    for (let i = 0; i < variablesNames.length; i++)
        if (variables.indexOf(variablesNames[i]) == -1)
            extra.push(variablesNames[i])

    for (let i = 0; i < extra.length; i++) {
        let index = variablesNames.indexOf(extra[i])
        variablesNames.splice(index, 1)
    }

    for (let i = 0; i < forgotten.length; i++)
        variablesNames.push(forgotten[i])

    for (let i = variablesNames.length - 1; i > 0; i--)
        if (variablesNames.indexOf(variablesNames[i]) < i)
            variablesNames.splice(i, 1)

    return variablesNames
}

FunctionTable.prototype.GetSimplifiedExpression = function() {
    let tree = this.calculator.MakeTree(this.calculator.rpn)
    let rpn = this.calculator.TreeToRpn(tree)
    return this.calculator.ToStringRPN(rpn)
}

// добавление в строку tr ячейки с текстом text
FunctionTable.prototype.AddCell = function(tr, text, name="td") {
    let cell = document.createElement(name)
    cell.innerText = text
    tr.appendChild(cell)
}

// вычисление значений функции на наборе переменных
FunctionTable.prototype.CalculateFunction = function() {
    let variables = Object.keys(this.calculator.variables)
    let total = 1 << variables.length

    let values = []
    let vector = []

    for (let i = 0; i < total; i++) {
        let values_row = []

        for (let j = 0; j < variables.length; j++) {
            values_row.push((i >> (variables.length - 1 - j)) & 1)
            this.calculator.SetValue(variables[j], values_row[j])
        }

        values.push(values_row)
        vector.push(this.calculator.Evaluate())
    }

    return {values:values, vector:vector}
}

// перевод в HTML таблицу
FunctionTable.prototype.ToHTML = function() {
    let table = document.createElement("table")
    let tr = document.createElement("tr")
    let variables = Object.keys(this.variables)

    for (let i = 0; i < variables.length; i++)
        this.AddCell(tr, variables[i], "th")
    this.AddCell(tr, "f", "th")

    table.appendChild(tr)

    for (let i = 0; i < this.values.length; i++) {
        let tr = document.createElement("tr")

        for (let j = 0; j < this.values[i].length; j++)
            this.AddCell(tr, this.values[i][j])

        this.AddCell(tr, this.vector[i])
        table.appendChild(tr)
    }

    return table
}

FunctionTable.prototype.GetKey = function() {
    if (this.expression == "0")
        return LEAF_ZERO

    if (this.expression == "1")
        return LEAF_ONE

    return this.expression
}

FunctionTable.prototype.BuildROBDD = function(variablesNames, applyes, solve, level = 0, index = 0) {
    let variables = Object.keys(this.calculator.variables)

    if (variables.length == 0) {
        let result = this.calculator.Evaluate()
        let value = result == 1 ? LEAF_ONE : LEAF_ZERO
        let node = {value: value, low: null, high: null, level: level, index: result == 1 ? 1 : -1 }
        applyes[value] = node
        return node
    }

    let i = 0

    while (variables.indexOf(variablesNames[i]) == -1)
        i++

    let variable = variablesNames[i]
    let splited = this.calculator.SplitByVariable(variable) // сплитим по первой доступной переменной
    let tableLow = new FunctionTable(splited.falseExpression)
    let tableHigh = new FunctionTable(splited.trueExpression)

    let printHigh = ["0", "1"].indexOf(tableHigh.expression) > -1 ? "[" + tableHigh.expression + "]" : "Apply(" + tableHigh.expression + ")"
    let printLow = ["0", "1"].indexOf(tableLow.expression) > -1 ? "[" + tableLow.expression + "]" : "Apply(" + tableLow.expression + ")"

    solve.push("Apply(" + this.expression + ") = Reduce(Compose(" + variable + ", " + printHigh +", " + printLow + "))")

    let high = tableHigh.GetKey() in applyes ? applyes[tableHigh.GetKey()] : tableHigh.BuildROBDD(variablesNames, applyes, solve, level + 1, 2 * index + 2)
    let low = tableLow.GetKey() in applyes ? applyes[tableLow.GetKey()] : tableLow.BuildROBDD(variablesNames, applyes, solve, level + 1, 2 * index + 1)
    let node = {value: variable, high: high, low: low, level: level, index: index }

    applyes[this.expression] = node

    return node
}

FunctionTable.prototype.GetROBDD = function(variablesNames) {
    let applyes = {}
    let solve = []
    let robdd = this.BuildROBDD(variablesNames, applyes, solve)

    return {applyes: applyes, solve: solve, robdd: robdd}
}