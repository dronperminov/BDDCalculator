function BDDCalculator(inputBox, resultBox, canvas, width, height) {
    this.inputBox = inputBox
    this.resultBox = resultBox
    
    this.canvas = canvas
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')
}

// построение BDD по выражению
BDDCalculator.prototype.Solve = function() {
    console.clear()
    try {
        this.ctx.clearRect(0, 0, this.width, this.height)

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
            this.resultBox.innerHTML += "TRUE: " + splited.trueExpression + "<br>"
            this.resultBox.innerHTML += "FALSE: " + splited.falseExpression
            this.resultBox.innerHTML += "</p>"
        }

        let robdd = funcTable.GetROBDD()

        this.DrawBDD(robdd.robdd, robdd.applyes)

        this.resultBox.innerHTML += "<p><b>Построение ROBDD:</b><br>"
        this.resultBox.innerHTML += robdd.solve.join("<br>")
        this.resultBox.innerHTML += "</p>"

        console.log(robdd.robdd, this.width)
    }
    catch (error) {
        this.resultBox.innerHTML = "<p><b>Ошибка:</b> " + error + "</p>"
        throw error
    }
}

// отрисовка линии
BDDCalculator.prototype.DrawLine = function(x1, y1, x2, y2, type) {
    this.ctx.strokeStyle = '#000'

    if (type == 1)
        this.ctx.setLineDash([6, 4])
    else
        this.ctx.setLineDash([])

    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
    this.ctx.setLineDash([])
}

// отрисовка рёбер
BDDCalculator.prototype.DrawEdges = function(node) {
    if (node.high == null || node.low == null)
        return

    let level = node.level
    let position = node.position * level

    this.DrawEdges(node.low)
    this.DrawEdges(node.high)

    console.log(node.value, node.high.value, node.low.value, node.x, node.y, node.high.x, node.high.y, node.low.x, node.low.y)
    this.DrawLine(node.x, node.y, node.high.x, node.high.y, 0)
    this.DrawLine(node.x, node.y, node.low.x, node.low.y, 1)
}

// задание координат узлов
BDDCalculator.prototype.SetNodeCoordinates = function(node, maxLevel, y0) {
    let ix = (node.index + 1.5) / (1 << node.level) - 1;
    let iy = (node.level + 0.5) / (maxLevel + 1);

    let x = ix * this.width
    let y = y0 + iy * (this.height - y0)

    if (this.IsLeafNode(node)) {
        x = this.width / 2 + node.index * this.width / 8
    }

    node.x = x
    node.y = y
}

// отрисока узла
BDDCalculator.prototype.DrawNode = function(node, maxLevel, radius) {
    this.ctx.fillStyle = '#efeeff'
    this.ctx.strokeStyle = '#000'
    this.ctx.beginPath()

    if (this.IsLeafNode(node)) {
        this.ctx.rect(node.x - radius, node.y - radius, 2 * radius, 2 * radius)
    }
    else {
        this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
    }

    this.ctx.fill()
    this.ctx.stroke()

    this.ctx.fillStyle = '#000'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.font = '16px Consolas'

    let text = node.value

    if (node.value == LEAF_ZERO)
        text = "0"

    if (node.value == LEAF_ONE)
        text = "1"

    this.ctx.fillText(text, node.x, node.y)
}

BDDCalculator.prototype.IsLeafNode = function(node) {
    return node.value == LEAF_ZERO || node.value == LEAF_ONE
}

// отрисовка диаграммы
BDDCalculator.prototype.DrawBDD = function(robdd, applyes) {
    let maxLevel = 0

    for (let node of Object.values(applyes))
        if (node.level > maxLevel && !this.IsLeafNode(node))
            maxLevel = node.level

    maxLevel += 1

    for (let node of Object.values(applyes))
        if (this.IsLeafNode(node))
            node.level = maxLevel

    let y0 = 5
    let radius = 20

    for (let node of Object.values(applyes))
        this.SetNodeCoordinates(node, maxLevel, y0)

    this.DrawEdges(robdd)

    for (let node of Object.values(applyes))
        this.DrawNode(node, maxLevel, radius)
}