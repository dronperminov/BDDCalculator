function BDDCalculator(inputBox, resultBox) {
    this.inputBox = inputBox
    this.resultBox = resultBox
}

// вычисление значений функции на наборе переменных
BDDCalculator.prototype.CalculateFunction = function(calculator) {
    let variables = Object.keys(calculator.variables)
    let total = 1 << variables.length

    let values = []
    let vector = []

    for (let i = 0; i < total; i++) {
        let values_row = []

        for (let j = 0; j < variables.length; j++) {
            values_row.push((i >> (variables.length - 1 - j)) & 1)
            calculator.SetValue(variables[j], values_row[j])
        }

        values.push(values_row)
        vector.push(calculator.Evaluate())
    }

    return new FunctionTable(calculator, values, vector)
}

// построение BDD по выражению
BDDCalculator.prototype.Solve = function() {
    console.clear()
    try {
        let calculator = new LogicalCalculator(this.inputBox.value)
        this.resultBox.innerHTML = "<p><b>Введённое выражение:</b> " + calculator.expression + "</p>"

        let funcTable = this.CalculateFunction(calculator)

        this.resultBox.innerHTML += "<p><b>Распаршенное выражение:</b> " + calculator.ToString() + "</p>"
        this.resultBox.innerHTML += "<p><b>Вектор функции:</b> " + funcTable.vector.join("") + "</p>"
        this.resultBox.innerHTML += "<p><b>Таблица истинности:</b></p>"
        this.resultBox.appendChild(funcTable.ToHTML())

        let variables = Object.keys(calculator.variables)

        for (let i = 0; i < variables.length; i++) {
            this.resultBox.innerHTML += "<p><b>Разбиение по переменной " + variables[i] + ":</b><br>"
            let splited = funcTable.SplitByVariable(variables[i])
            this.resultBox.innerHTML += "TRUE: " + splited.true_expression + "<br>"
            this.resultBox.innerHTML += "FALSE: " + splited.false_expression
            this.resultBox.innerHTML += "</p>"
        }
    }
    catch (error) {
        this.resultBox.innerHTML += "<p><b>Ошибка:</b> " + error + "</p>"
        throw error
    }
}