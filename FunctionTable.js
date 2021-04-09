function FunctionTable(expression) {
    this.calculator = new LogicalCalculator(expression)
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
    let true_rpn = Array.from(this.calculator.rpn)
    let false_rpn = Array.from(this.calculator.rpn)

    for (let i = 0; i < this.calculator.rpn.length; i++) {
        if (this.calculator.IsVariable(this.calculator.rpn[i]) && this.calculator.rpn[i] == name) {
            true_rpn[i] = "1"
            false_rpn[i] = "0"
        }
    }

    let true_tree = this.calculator.MakeTree(true_rpn)
    let false_tree = this.calculator.MakeTree(false_rpn)

    console.log("-------------------------------------------------------")
    console.log("Split by", name)
    console.log("TRUE RPN (BEFORE):", this.calculator.ToStringRPN(true_rpn))
    console.log("TRUE TREE:", true_tree)
    console.log("TRUE TREE VARIABLES:", this.calculator.GetTreeVariables(true_tree))
    true_rpn = this.calculator.TreeToRpn(true_tree)
    console.log("TRUE RPN (AFTER):", this.calculator.ToStringRPN(true_rpn))

    console.log("FALSE RPN (BEFORE):", false_rpn)
    console.log("FALSE TREE:", false_tree)
    console.log("FALSE TREE VARIABLES:", this.calculator.GetTreeVariables(false_tree))
    false_rpn = this.calculator.TreeToRpn(false_tree)
    console.log("FALSE RPN (AFTER):", false_rpn)

    let true_expression = this.calculator.ToStringRPN(true_rpn)
    let false_expression = this.calculator.ToStringRPN(false_rpn)

    return {true_expression: true_expression, false_expression: false_expression}
}