var xml2js = require('xml2js');
const fs = require('fs/promises');

var replacer = new Map();

var maxHeight = 0
var maxWidth = 0

function updateSubGroup(group, factor) {
    if (group.g && group.g.length > 0) {
        for (const g of group.g) {
            updateSubGroup(g, factor)
        }
    }
    if (group.a && group.a.length > 0) {
        for (const a of group.a) {
            updateSubGroup(a, factor)
        }
    }

    if (group.path && group.path.length > 0) {
        for (const path of group.path) {
            path['$'].d = editPath(path['$'].d, factor)
        }
    }

    if (group.circle && group.circle.length > 0) {
        for (const circle of group.circle) {
            circle['$'] = editFigure(circle['$'], factor)
        }
    }

    if (group.ellipse && group.ellipse.length > 0) {
        for (const ellipse of group.ellipse) {
            ellipse['$'] = editFigure(ellipse['$'], factor)
            // modifier les transform
        }
    }
}

function editTransform(transform, factor) {
    var reg = /rotate\(([^\)]*)\)/g;
    var regRes = reg.exec(transform)
    if (regRes) {
        var rotate = regRes[1].split(',');
        if (rotate.length === 1) {
            return `rotate(${rotate[0]})`
        }
        newX = rotate[1] * factor
        newY = rotate[2] * factor
        maxHeight = Math.max(newY, maxHeight)
        maxWidth = Math.max(newX, maxWidth)
        return `rotate(${rotate[0]}, ${newX}, ${newY})`
    }
    return transform
}

function editFigure(currentFigure, factor) {
    var x = 0, y = 0
    if (currentFigure.cx) {
        x = currentFigure.cx;
        y = currentFigure.cy;
        if (x) {
            currentFigure.cx = x * factor
            currentFigure.cy = y * factor
            maxHeight = Math.max(currentFigure.cy, maxHeight)
            maxWidth = Math.max(currentFigure.cx, maxWidth)
        }
    } else if (currentFigure.x) {
        x = currentFigure.x
        y = currentFigure.y
        currentFigure.x = x * factor
        currentFigure.y = y * factor
        maxHeight = Math.max(currentFigure.y, maxHeight)
        maxWidth = Math.max(currentFigure.x, maxWidth)
    }
    currentFigure.transform = editTransform(currentFigure.transform, factor)
    return currentFigure
}

function editPath(currentPath, factor) {
    var k = currentPath.split(' ')
    var doTransfo = false
    var onlyRotation = false;
    return k.map((z) => {
        if (z.includes(',')) {
            var j = z.split(',');
            var x = j[0] * factor
            var y = j[1] * factor
            maxHeight = Math.max(y, maxHeight)
            maxWidth = Math.max(x, maxWidth)
            return [
                x,
                y,
            ].join(',');
        }
        return z;
    },[]).join(' ');
}

async function main() {
    const svg = await fs.readFile('src/data/map.svg')
    var parser = new xml2js.Parser(/* options */);
    var svgInXml = await parser.parseStringPromise(svg)
    var factor = 2

    for (const group of svgInXml.svg.g) {
        updateSubGroup(group, factor)
        group['$'].transform = undefined
    }

    var builder = new xml2js.Builder();
    var xml = builder.buildObject(svgInXml);
    await fs.writeFile('./tmp2.svg', xml.toString({
        pretty: true,
        indent: ' ',
        offset: 4,
        newline: ' ',
    }));
    console.log(`${maxWidth} ${maxHeight}`)
}
void main()