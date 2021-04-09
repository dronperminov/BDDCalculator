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

// разбиение по переменной
FunctionTable.prototype.SplitByVariable = function(name) {
    let trueRpn = Array.from(this.calculator.rpn)
    let falseRpn = Array.from(this.calculator.rpn)

    for (let i = 0; i < this.calculator.rpn.length; i++) {
        if (this.calculator.IsVariable(this.calculator.rpn[i]) && this.calculator.rpn[i] == name) {
            trueRpn[i] = "1"
            falseRpn[i] = "0"
        }
    }

    let trueTree = this.calculator.MakeTree(trueRpn)
    let falseTree = this.calculator.MakeTree(falseRpn)

    /*console.log("-------------------------------------------------------")
    console.log("Split by", name)
    console.log("TRUE RPN (BEFORE):", this.calculator.ToStringRPN(trueRpn))
    console.log("TRUE TREE:", trueTree)
    console.log("TRUE TREE VARIABLES:", this.calculator.GetTreeVariables(trueTree))
    console.log("TRUE RPN (AFTER):", this.calculator.ToStringRPN(trueRpn))

    console.log("FALSE RPN (BEFORE):", falseRpn)
    console.log("FALSE TREE:", falseTree)
    console.log("FALSE TREE VARIABLES:", this.calculator.GetTreeVariables(falseTree))
    console.log("FALSE RPN (AFTER):", falseRpn)*/
    trueRpn = this.calculator.TreeToRpn(trueTree)
    falseRpn = this.calculator.TreeToRpn(falseTree)

    let trueExpression = this.calculator.ToStringRPN(trueRpn)
    let falseExpression = this.calculator.ToStringRPN(falseRpn)

    return {trueExpression: trueExpression, falseExpression: falseExpression}
}

FunctionTable.prototype.GetKey = function() {
    if (this.expression == "0")
        return LEAF_ZERO

    if (this.expression == "1")
        return LEAF_ONE

    return this.expression
}

FunctionTable.prototype.BuildROBDD = function(applyes, solve, level = 0, index = 0) {
    let variables = Object.keys(this.calculator.variables)

    if (variables.length == 0) {
        let result = this.calculator.Evaluate()
        let value = result == 1 ? LEAF_ONE : LEAF_ZERO
        let node = {value: value, low: null, high: null, level: level, index: result == 1 ? 1 : -1 }
        applyes[value] = node
        return node
    }

    let variable = variables[0]
    let splited = this.SplitByVariable(variable) // сплитим по первой доступной переменной
    let tableLow = new FunctionTable(splited.falseExpression)
    let tableHigh = new FunctionTable(splited.trueExpression)

    let printHigh = ["0", "1"].indexOf(tableHigh.expression) > -1 ? "[" + tableHigh.expression + "]" : "Apply(" + tableHigh.expression + ")"
    let printLow = ["0", "1"].indexOf(tableLow.expression) > -1 ? "[" + tableLow.expression + "]" : "Apply(" + tableLow.expression + ")"

    solve.push("Apply(" + this.expression + ") = Reduce(Compose(" + variable + ", " + printHigh +", " + printLow + "))")

    let high = tableHigh.GetKey() in applyes ? applyes[tableHigh.GetKey()] : tableHigh.BuildROBDD(applyes, solve, level + 1, 2 * index + 2)
    let low = tableLow.GetKey() in applyes ? applyes[tableLow.GetKey()] : tableLow.BuildROBDD(applyes, solve, level + 1, 2 * index + 1)
    let node = {value: variable, high: high, low: low, level: level, index: index }

    applyes[this.expression] = node

    return node
}

FunctionTable.prototype.GetROBDD = function() {
    let applyes = {}
    let solve = []
    let robdd = this.BuildROBDD(applyes, solve)

    return {applyes: applyes, solve: solve, robdd: robdd}
}