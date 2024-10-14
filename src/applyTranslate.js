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
        // allowEmpty?: boolean;
        // spacebeforeslash?: string;
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
// res = groupes.map((groupe) => {
//     if(groupe === '' || groupe === '\n') {
//         return groupe;
//     }
//     var cx = 2767.1219;
//     var cy = 5149.0306;
//     var angle = 60 * (Math.PI / 180);
//     var rotateMatrixInitial = {
//         'a': Math.cos(angle).toFixed(5),
//         'b': Math.sin(angle).toFixed(5),
//         'c': -Math.sin(angle).toFixed(5),
//         'd': Math.cos(angle).toFixed(5),
//         'e': -cx * Math.cos(angle).toFixed(5) + cy * Math.sin(angle).toFixed(5) + 1 * cx,
//         'f': -cx * Math.sin(angle).toFixed(5) - cy * Math.cos(angle).toFixed(5)+ 1 * cy,
//     }
//
//     var reg = /rotate\(([^\)]*)\)/g;
//     var regRes = reg.exec(groupe)
//     if (regRes) {
//         var rotate = regRes[1].split(',');
//         var angle = rotate[0] * (Math.PI / 180);
//         var cx = 0;
//         var cy = 0;
//         if (rotate.length > 1) {
//             cx = rotate[1];
//             cy = rotate[2];
//         }
//         rotateMatrix = {
//             'a': Math.cos(angle).toFixed(5),
//             'b': Math.sin(angle).toFixed(5),
//             'c': -Math.sin(angle).toFixed(5),
//             'd': Math.cos(angle).toFixed(5),
//             'e': -cx * Math.cos(angle).toFixed(5) + cy * Math.sin(angle).toFixed(5) + 1 * cx,
//             'f': -cx * Math.sin(angle).toFixed(5) - cy * Math.cos(angle).toFixed(5)+ 1 * cy,
//         }
//     } else {
//         rotateMatrix = {
//             'a': 1,
//             'b': 0,
//             'c': 0,
//             'd': 1,
//             'e': 0,
//             'f': 0,
//         }
//     }
//
//
//     var combineMatrix2 = {
//         'a': rotateMatrixInitial['a'] * rotateMatrix['a'] + rotateMatrixInitial['c'] * rotateMatrix['b'],
//         'b': rotateMatrixInitial['b'] * rotateMatrix['a'] + rotateMatrixInitial['d'] * rotateMatrix['b'],
//         'c': rotateMatrixInitial['a'] * rotateMatrix['c'] + rotateMatrixInitial['c'] * rotateMatrix['d'],
//         'd': rotateMatrixInitial['b'] * rotateMatrix['c'] + rotateMatrixInitial['d'] * rotateMatrix['d'],
//         'e': rotateMatrixInitial['a'] * rotateMatrix['e'] + rotateMatrixInitial['c'] * rotateMatrix['f'] + rotateMatrixInitial['e'],
//         'f': rotateMatrixInitial['b'] * rotateMatrix['e'] + rotateMatrixInitial['d'] * rotateMatrix['f'] + rotateMatrixInitial['f'],
//     }
//         var reg = /matrix\(([^\)]*)\)/g;
//         var regRes = reg.exec(groupe)
//         if ( regRes){
//             var matrix = regRes[1].split(',');
//             rotateMatrix = {
//                 'a': matrix[0],
//                 'b': matrix[1],
//                 'c': matrix[2],
//                 'd': matrix[3],
//                 'e': matrix[4],
//                 'f': matrix[5],
//             }
//         } else {
//             rotateMatrix = {
//                 'a': 1,
//                 'b': 0,
//                 'c': 0,
//                 'd': 1,
//                 'e': 0,
//                 'f': 0,
//             }
//         }
//
//
//     combineMatrix2 = {
//         'a': combineMatrix2['a'] * rotateMatrix['a'] + combineMatrix2['c'] * rotateMatrix['b'],
//         'b': combineMatrix2['b'] * rotateMatrix['a'] + combineMatrix2['d'] * rotateMatrix['b'],
//         'c': combineMatrix2['a'] * rotateMatrix['c'] + combineMatrix2['c'] * rotateMatrix['d'],
//         'd': combineMatrix2['b'] * rotateMatrix['c'] + combineMatrix2['d'] * rotateMatrix['d'],
//         'e': combineMatrix2['a'] * rotateMatrix['e'] + combineMatrix2['c'] * rotateMatrix['f'] + combineMatrix2['e'],
//         'f': combineMatrix2['b'] * rotateMatrix['e'] + combineMatrix2['d'] * rotateMatrix['f'] + combineMatrix2['f'],
//     }
//
//     var reg = /translate\(([^\)]*)\)/g;
//     var regRes = reg.exec(groupe)
//     if ( regRes) {
//         var matrix = regRes[1].split(',');
//         var rotateMatrix = {
//             'a': 1,
//             'b': 0,
//             'c': 0,
//             'd': 1,
//             'e': matrix[0],
//             'f': matrix[1],
//         }
//         var tmpMatrix = combineMatrix2
//         combineMatrix2 = {
//             'a': tmpMatrix['a'] * rotateMatrix['a'] + tmpMatrix['c'] * rotateMatrix['b'],
//             'b': tmpMatrix['b'] * rotateMatrix['a'] + tmpMatrix['d'] * rotateMatrix['b'],
//             'c': tmpMatrix['a'] * rotateMatrix['c'] + tmpMatrix['c'] * rotateMatrix['d'],
//             'd': tmpMatrix['b'] * rotateMatrix['c'] + tmpMatrix['d'] * rotateMatrix['d'],
//             'e': tmpMatrix['a'] * rotateMatrix['e'] + tmpMatrix['c'] * rotateMatrix['f'] + tmpMatrix['e'],
//             'f': tmpMatrix['b'] * rotateMatrix['e'] + tmpMatrix['d'] * rotateMatrix['f'] + tmpMatrix['f'],
//         }
//     }
// console.log("############rotateMatrixInitial##############")
// console.log(JSON.stringify(rotateMatrixInitial, null, 2))
// console.log(JSON.stringify(combineMatrix2, null, 2))
// console.log("##########################")
//     var re = / d="([^"]*)"/g;
//     do {
//         m = re.exec(groupe);
//         if (m) {
//             var k = m[1].split(' ')
//             var doTransfo = false
//             var onlyRotation = false;
//             const res = k.map((z) => {
//                 if (z.length === 1) {
//                     doTransfo = z === 'm'
//                 } else if (z.length === 1) {
//                     doTransfo = z !== 'm'
//                 }
//                 if(doTransfo && z.includes(',')) {
//                     var j = z.split(',');
//                     if (!onlyRotation) {
//                         onlyRotation = true
//                         return [
//                             j[0] * combineMatrix2['a'] - j[1] * combineMatrix2['b'] + combineMatrix2['e'],
//                             -j[0] * combineMatrix2['c'] + j[1] * combineMatrix2['d'] + combineMatrix2['f'],
//                         ].join(',');
//                     }
//                     return [
//                         j[0] * combineMatrix2['a'] - j[1] * combineMatrix2['b'],
//                         -j[0] * combineMatrix2['c'] + j[1] * combineMatrix2['d'],
//                     ].join(',');
//                 } else if (z.includes(',') && k.length > 5 ) {
//                     var j = z.split(',');
//                     return [
//                         j[0]*combineMatrix2['a']-j[1]*combineMatrix2['b'],
//                         -j[0]*combineMatrix2['c']+j[1]*combineMatrix2['d'],
//                     ].join(',');
//                 }
//                 return z;
//             },[]).join(' ');
//             replacer.set(m[1], res);
//         } else {
//             if (groupe.includes('cx=')) {
//                 var rex = / cx="([^"]*)"/g;
//                 var rey = / cy="([^"]*)"/g;
//                 x = rex.exec(groupe);
//                 y = rey.exec(groupe);
//                 if (x) {
//                     replacer.set(` cx="${x[1]}"`, ` cx="${x[1] * combineMatrix2['a'] - y[1] * combineMatrix2['b'] + combineMatrix2['e']}"`);
//                     replacer.set(` cy="${y[1]}"`, ` cy="${-x[1] * combineMatrix2['c'] + y[1] * combineMatrix2['d'] + combineMatrix2['f']}"`);
//                 }
//             } else if (groupe.includes('x=')) {
//                         var rex = / x="([^"]*)"/g;
//                         var rey = / y="([^"]*)"/g;
//                         x = rex.exec(groupe);
//                         y = rey.exec(groupe);
//                         replacer.set(` x="${x[1]}"`, ` x="${x[1] * combineMatrix2['a'] - y[1] * combineMatrix2['b'] + combineMatrix2['e']}"`);
//                         replacer.set(` y="${-y[1]}"`, ` y="${-x[1] * combineMatrix2['c'] + y[1] * combineMatrix2['d'] + combineMatrix2['f']}"`);
//             }
//
//         }
//
//     } while (m);
//     replacer.forEach((value, key) => {
//         groupe = groupe.replaceAll(key, value);
//     });
//     groupe = groupe.replaceAll(/transform=\"matrix\(([^\)]*)\)\"/g, '');
//     groupe = groupe.replaceAll(/transform=\"rotate\(([^\)]*)\)\"/g, '');
//     groupe = groupe.replaceAll(/transform=\"translate\(([^\)]*)\)\"/g, '');
//     return groupe
// }).join('</g>');

// console.log(res);
/*

        <xsl:attribute name="cx">
        <xsl:value-of select="@cx*0.5+@cy*(-0.8660253985)+5842.753040037"/>
        </xsl:attribute>
        <xsl:attribute name="cy">
        <xsl:value-of select="@cx*0.8660253985+@cy*0.5+178.1175757042"/>

a: 0.09679999947547913
​
b: 0
​
c: 0
​
d: 0.09679999947547913
​
e: 481.5442810058594
​
f: -11.141083717346191


a: 0.04839999973773956
b: -0.08383125811815262
c: 0.08383125811815262
d: 0.04839999973773956
e: 171.4026336669922
f: 470.8123779296875

1
0
0
1
57.275630536173956
-115.0938406788772

 */
