function BDDCalculator(inputBox, resultBox) {
    this.inputBox = inputBox
    this.resultBox = resultBox
}

// построение BDD по выражению
BDDCalculator.prototype.Solve = function() {
    console.clear()
    try {
        let funcTable = new FunctionTable(this.inputBox.value)

        this.resultBox.innerHTML = "<p><b>Введённое выражение:</b> " + funcTable.calculator.expression + "</p>"
        this.resultBox.innerHTML += "<p><b>Распаршенное выражение:</b> " + funcTable.calculator.ToString() + "</p>"
        this.resultBox.innerHTML += "<p><b>Вектор функции:</b> " + funcTable.vector.join("") + "</p>"
        this.resultBox.innerHTML += "<p><b>Таблица истинности:</b></p>"
        this.resultBox.appendChild(funcTable.ToHTML())

        let variables = Object.keys(funcTable.calculator.variables)

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