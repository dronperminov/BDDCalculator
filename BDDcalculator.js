function BDDCalculator(inputBox, variablesBox, resultBox, canvas, width, height) {
    this.inputBox = inputBox
    this.variablesBox = variablesBox
    this.resultBox = resultBox
    
    this.canvas = canvas
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')

    let calculator = this
    this.canvas.addEventListener('mousedown', function(e) { calculator.MouseDown(e) })
    this.canvas.addEventListener('mouseup', function(e) { calculator.MouseUp(e) })
    this.canvas.addEventListener('mousemove', function(e) { calculator.MouseMove(e) })

    this.isPressed = false
    this.prevX = 0
    this.prevY = 0
    this.activeNode = null
}

// построение BDD по выражению
BDDCalculator.prototype.Solve = function() {
    console.clear()
    try {
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.funcTable = new FunctionTable(this.inputBox.value)
        this.variablesNames = this.variablesBox.value.split(/ +/g)

        if (!this.funcTable.HaveAllVariables(this.variablesNames))
            throw "Variable names not match with variables in expression"

        this.resultBox.innerHTML = "<p><b>Введённое выражение:</b> " + this.funcTable.calculator.expression + "</p>"
        this.resultBox.innerHTML += "<p><b>Распаршенное выражение:</b> " + this.funcTable.calculator.ToString() + "</p>"
        this.resultBox.innerHTML += "<p><b>Вектор функции:</b> " + this.funcTable.vector.join("") + "</p>"
        this.resultBox.innerHTML += "<p><b>Таблица истинности:</b></p>"
        this.resultBox.appendChild(this.funcTable.ToHTML())

        let variables = Object.keys(this.funcTable.calculator.variables)

        for (let i = 0; i < variables.length; i++) {
            this.resultBox.innerHTML += "<p><b>Разбиение по переменной " + variables[i] + ":</b><br>"
            let splited = this.funcTable.SplitByVariable(variables[i])
            this.resultBox.innerHTML += "TRUE: " + splited.trueExpression + "<br>"
            this.resultBox.innerHTML += "FALSE: " + splited.falseExpression
            this.resultBox.innerHTML += "</p>"
        }

        let robdd = this.funcTable.GetROBDD(this.variablesNames)

        this.robdd = robdd.robdd
        this.applyes = robdd.applyes
        this.DrawBDD()

        this.resultBox.innerHTML += "<p><b>Построение ROBDD:</b><br>"
        this.resultBox.innerHTML += robdd.solve.join("<br>")
        this.resultBox.innerHTML += "</p>"

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

    this.DrawLine(node.x, node.y, node.high.x, node.high.y, 0)
    this.DrawLine(node.x, node.y, node.low.x, node.low.y, 1)
}

// задание координат узлов
BDDCalculator.prototype.SetNodeCoordinates = function(node, maxLevel, y0, radius) {
    let ix = (node.index + 1.5) / (1 << node.level) - 1;
    let iy = (node.level + 0.5) / (maxLevel + 1);

    let x = ix * this.width
    let y = y0 + iy * (this.height - y0)

    if (this.IsLeafNode(node)) {
        x = this.width / 2 + node.index * this.width / 8
    }

    node.x = x
    node.y = y
    node.radius = radius
}

// отрисока узла
BDDCalculator.prototype.DrawNode = function(node) {
    this.ctx.fillStyle = '#efeeff'
    this.ctx.strokeStyle = '#000'
    this.ctx.beginPath()

    if (this.IsLeafNode(node)) {
        this.ctx.rect(node.x - node.radius, node.y - node.radius, 2 * node.radius, 2 * node.radius)
    }
    else {
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
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
BDDCalculator.prototype.DrawBDD = function() {
    let maxLevel = 0

    for (let node of Object.values(this.applyes))
        if (node.level > maxLevel && !this.IsLeafNode(node))
            maxLevel = node.level

    maxLevel += 1

    for (let node of Object.values(this.applyes))
        if (this.IsLeafNode(node))
            node.level = maxLevel

    let y0 = 5
    let radius = 20

    for (let node of Object.values(this.applyes))
        this.SetNodeCoordinates(node, maxLevel, y0, radius)

    this.Draw()
}

// отрисовка дерева на картинке
BDDCalculator.prototype.Draw = function() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.DrawEdges(this.robdd)

    for (let node of Object.values(this.applyes))
        this.DrawNode(node)

    this.ctx.fillStyle = '#000'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'
    this.ctx.font = '18px Consolas'
    this.ctx.fillText("Формула: " + this.funcTable.calculator.expression, 10, 18)
    this.ctx.fillText("Порядок переменных: " + this.variablesNames.join(", "), 10, 40)
}

// проверка, что мышь находится над узлом
BDDCalculator.prototype.IsMouseHoverNode = function(x, y, node) {
    let dx = x - node.x
    let dy = y - node.y

    return dx*dx + dy*dy < node.radius * node.radius
}

BDDCalculator.prototype.GetHoverNode = function(x, y) {
    for (let node of Object.values(this.applyes))
        if (this.IsMouseHoverNode(x, y, node))
            return node

    return null
}

// обработка нажатия мыши
BDDCalculator.prototype.MouseDown = function(e) {
    this.isPressed = true
    this.activeNode = this.GetHoverNode(e.offsetX, e.offsetY)
    this.prevX = e.offsetX
    this.prevY = e.offsetY
}

// обработка отпускания мыши
BDDCalculator.prototype.MouseUp = function(e) {
    this.isPressed = false
    this.activeNode = null
}

// обработка перемещения мыши
BDDCalculator.prototype.MouseMove = function(e) {
    if (!this.isPressed || this.activeNode == null)
        return

    let dx = e.offsetX - this.prevX
    let dy = e.offsetY - this.prevY
    let delta = 5
    let node = this.activeNode
    let radius = node.radius

    if (Math.abs(dx) > delta && node.x + dx >= radius && node.x + dx < this.width - radius) {
        this.activeNode.x += dx
        this.prevX = e.offsetX
    }

    if (node.level > 0 && Math.abs(dy) > delta && node.y + dy >= radius && node.y + dy < this.height - radius) {
        this.activeNode.y += dy
        this.prevY = e.offsetY
    }

    this.Draw()
}