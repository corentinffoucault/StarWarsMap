var xml2js = require('xml2js');
const fs = require('fs/promises');

var replacer = new Map();

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
        if (!group.a) {
            group.a = []
            group.circle.forEach((it)=> {
                if (planetesParse.has(it.$.id)) {
                    it.title = [{"_":planetesParse.get(it.$.id)}]
                } else {
                    missingPlanete.push(it.$.id)
                }
                const a = {$:{class: 'path', hover:"fill:green", href:"https://starwars.fandom.com/fr/wiki/Voie_Hydienne"}, circle:[it]}
                group.a.push(a)
            })
            delete group.circle
        }
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
                it.g.forEach(it2 => {
                    it2.title = [{"_":it2.$['inkscape:label']}]
                    if (!it2.a || it2.a.length === 0) {
                        it2.a = [{$:{class: 'path', hover:"fill:green", href:"https://starwars.fandom.com/fr/wiki/Voie_Hydienne"}, path: [...it2.path]}]
                        it2.path = []
                    }
                    if (it2.$['inkscape:label'] === "Voie Hydienne") {
                        console.log(`aaaaa ${JSON.stringify(it2.a[0].path)}`)
                    }
                })
            })
        } else if (group.$['inkscape:label'] === "Régions") {
            group.g.forEach(it2 => {
                it2.title = [{"_":it2.$['inkscape:label']}]
                if (!it2.a || it2.a.length === 0) {
                    const keys = Object.keys(it2)
                    const a = {$:{class: 'path', hover:"fill:green", href:"https://starwars.fandom.com/fr/wiki/Voie_Hydienne"}}
                    keys.forEach(key => {
                        if (key!=='$' && key!=="title") {
                            a[key] = [...it2[key]]
                            delete it2[key]
                        }
                    })
                    it2.a = [a]
                }
                if (it2.$['inkscape:label'] === "Voie Hydienne") {
                    console.log(`aaaaa ${JSON.stringify(it2.a[0].path)}`)
                }
            })
        }
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
