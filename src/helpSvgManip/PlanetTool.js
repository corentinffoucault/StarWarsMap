var xml2js = require('xml2js');
const fs = require('fs/promises');

var replacer = new Map();

/*
[
  'circle57',    'circle12',
  'circle30',    'circle392',
  'circle102-1', 'circle131',
  'circle167-0', 'circle99',
  'circle208',   'circle332-0',
  'circle545-6', 'circle636-2',
  'circle209-6', 'circle639-7',
  'circle675-9', 'circle678-7'
]
*/
async function AddPlaneteTitle(group) {
        if (group.$['inkscape:label'] !== "Planètes") {
            return
        }

        const planetes = JSON.parse(await fs.readFile('../planetes.json'))
        const planetesParse = Object.values(planetes).reduce((acc, it) => { 
            acc.set(it.id, it.name);
            return acc
         }, new Map() )
        const missingPlanete = []
        group.circle.forEach((it)=> {
            console.log(`beee ${JSON.stringify(it.$.id)}`)
            if (planetesParse.has(it.$.id)) {
                it.title = [{"_":planetesParse.get(it.$.id)}]
            } else {
                missingPlanete.push(it.$.id)
            }
        })
        console.log(missingPlanete)
}

async function main() {
    const svg = await fs.readFile('../data/map.svg')
    var parser = new xml2js.Parser(/* options */);
    var svgInXml = await parser.parseStringPromise(svg)

    for (const group of svgInXml.svg.g) {
        await AddPlaneteTitle(group)
        if (group.$['inkscape:label'] === "Routes spatiales") {
            group.g.forEach(it => {
                if (it.$['inkscape:label'] === "Principales") {
                it.g.forEach(it2 => {
                        if (it2.$['inkscape:label'] === "Voie Hydienne") {
                            console.log(`aaaaa ${JSON.stringify(it2.a[0].path[0].title[0]._)}`)
                        }
                })
                }
            })
        }
    }

    var builder = new xml2js.Builder();
    var xml = builder.buildObject(svgInXml);
    await fs.writeFile('./tmp2.json', xml.toString({

        pretty: true,
        indent: ' ',
        offset: 4,
        newline: ' ',
        // allowEmpty?: boolean;
        // spacebeforeslash?: string;
    }));
}
void main()
