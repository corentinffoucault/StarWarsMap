var xml2js = require('xml2js');
const fs = require('fs/promises');

var replacer = new Map();

function updateSubGroup(group, parentMatrix) {
    var reg = /translate\(([^\)]*)\)/g
    var regRes = reg.exec(group['$'].transform)
    var transformMatrix = parentMatrix
    if (regRes) {
        var matrix = regRes[1].split(',')
        var translateMatrix = {
            'a': 1,
            'b': 0,
            'c': 0,
            'd': 1,
            'e': +matrix[0],
            'f': +matrix[1],
        }
        transformMatrix = multipliMatrix(translateMatrix, parentMatrix)
    }
    if (group.g && group.g.length > 0) {
        for (const g of group.g) {
            updateSubGroup(g, transformMatrix)
        }
    }
    if (group.a && group.a.length > 0) {
        for (const a of group.a) {
            updateSubGroup(a, transformMatrix)
        }
    }

    if (group.path && group.path.length > 0) {
        for (const path of group.path) {
            path['$'].d = editPath(path['$'].d, transformMatrix)
        }
    }

    if (group.circle && group.circle.length > 0) {
        for (const circle of group.circle) {
            circle['$'] = editFigure(circle['$'], transformMatrix)
        }
    }

    if (group.ellipse && group.ellipse.length > 0) {
        for (const ellipse of group.ellipse) {
            ellipse['$'] = editFigure(ellipse['$'], transformMatrix)
            // modifier les transform
        }
    }
}

function editTransform(transform, currentMatrix) {
    var reg = /rotate\(([^\)]*)\)/g;
    var regRes = reg.exec(transform)
    if (regRes) {
        var rotate = regRes[1].split(',');
        if (rotate.length === 1) {
            return `rotate(${rotate[0]})`
        }
        x = rotate[1]
        y = rotate[2]
        newX = x * currentMatrix['a'] - y * currentMatrix['b'] + currentMatrix['e']
        newY = -x * currentMatrix['c'] + y * currentMatrix['d'] + currentMatrix['f']
        return `rotate(${rotate[0]}, ${newX}, ${newY})`
    }
    return transform
}

function editFigure(currentFigure, currentMatrix) {
    var x = 0, y = 0
    if (currentFigure.cx) {
        x = currentFigure.cx;
        y = currentFigure.cy;
        if (x) {
            currentFigure.cx = x * currentMatrix['a'] - y * currentMatrix['b'] + currentMatrix['e']
            currentFigure.cy = -x * currentMatrix['c'] + y * currentMatrix['d'] + currentMatrix['f']
        }
    } else if (currentFigure.x) {
        x = currentFigure.x
        y = currentFigure.y
        currentFigure.x = x * currentMatrix['a'] - y * currentMatrix['b'] + currentMatrix['e']
        currentFigure.y = -x * currentMatrix['c'] + y * currentMatrix['d'] + currentMatrix['f']
    }
    currentFigure.transform = editTransform(currentFigure.transform, currentMatrix)
    return currentFigure
}

function editPath(currentPath, currentMatrix) {
    var k = currentPath.split(' ')
    var doTransfo = false
    var onlyRotation = false;
    return k.map((z) => {
        if (z.length === 1) {
            doTransfo = z === 'm'
        } else if (z.length === 1) {
            doTransfo = z !== 'm'
        }
        if(doTransfo && z.includes(',')) {
            var j = z.split(',');
            if (!onlyRotation) {
                onlyRotation = true
                return [
                    j[0] * currentMatrix['a'] - j[1] * currentMatrix['b'] + currentMatrix['e'],
                    -j[0] * currentMatrix['c'] + j[1] * currentMatrix['d'] + currentMatrix['f'],
                ].join(',');
            }
            return [
                j[0] * currentMatrix['a'] - j[1] * currentMatrix['b'],
                -j[0] * currentMatrix['c'] + j[1] * currentMatrix['d'],
            ].join(',');
        } else if (z.includes(',') && k.length > 5 ) {
            var j = z.split(',');
            return [
                j[0]*currentMatrix['a']-j[1]*currentMatrix['b'],
                -j[0]*currentMatrix['c']+j[1]*currentMatrix['d'],
            ].join(',');
        }
        return z;
    },[]).join(' ');
}

async function main() {
    const svg = await fs.readFile('tmp.svg')
    var parser = new xml2js.Parser(/* options */);
    var svgInXml = await parser.parseStringPromise(svg)
    var initialMatrix = { 'a': 1, 'b': 0, 'c': 0, 'd': 1, 'e': 0, 'f': 0 }

    for (const group of svgInXml.svg.g) {
        updateSubGroup(group, initialMatrix)
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
}
void main()

function multipliMatrix(m1,m2) {
    return {
        'a': m1['a']*m2['a']+m1['c']*m2['b'],
        'b': m1['b']*m2['a']+m1['d']*m2['b'],
        'c': m1['a']*m2['c']+m1['c']*m2['d'],
        'd': m1['b']*m2['c']+m1['d']*m2['d'],
        'e': m1['a']*m2['e']+m1['c']*m2['e']+m1['e'],
        'f': m1['b']*m2['f']+m1['d']*m2['f']+m1['f'],
    }
}