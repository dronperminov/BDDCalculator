function BDDCalculator(inputBox, resultBox) {
    this.inputBox = inputBox
    this.resultBox = resultBox
}

// добавление в строку tr ячейки с текстом text
BDDCalculator.prototype.AddCell = function(tr, text, name="td") {
    let cell = document.createElement(name)
    cell.innerText = text
    tr.appendChild(cell)
}

// получение таблицы истинности
BDDCalculator.prototype.MakeFunctionTable = function(func) {
    let table = document.createElement("table")
    let tr = document.createElement("tr")
    let variables = Object.keys(func.variables)

    for (let i = 0; i < variables.length; i++)
        this.AddCell(tr, variables[i], "th")
    this.AddCell(tr, "f", "th")

    table.appendChild(tr)

    for (let i = 0; i < func.values.length; i++) {
        let tr = document.createElement("tr")

        for (let j = 0; j < func.values[i].length; j++)
            this.AddCell(tr, func.values[i][j])

        this.AddCell(tr, func.vector[i])
        table.appendChild(tr)
    }

    return table
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

    return { values: values, vector: vector, variables: calculator.variables }
}

// построение BDD по выражению
BDDCalculator.prototype.Solve = function() {
    try {
        let calculator = new LogicalCalculator(this.inputBox.value)
        this.resultBox.innerHTML = "<p><b>Введённое выражение:</b> " + calculator.expression + "</p>"

        let result = this.CalculateFunction(calculator)
        let table = this.MakeFunctionTable(result)

        this.resultBox.innerHTML += "<p><b>Вектор функции:</b> " + result.vector.join("") + "</p>"
        this.resultBox.innerHTML += "<p><b>Таблица истинности:</b></p>"
        this.resultBox.appendChild(table)
    }
    catch (error) {
        this.resultBox.innerHTML += "<p><b>Ошибка:</b> " + error + "</p>"

    }
}