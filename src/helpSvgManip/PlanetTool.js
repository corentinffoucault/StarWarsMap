var xml2js = require('xml2js');
const fs = require('fs/promises');

var replacer = new Map();

async function AddPlaneteTitle(group) {
    if (group.$['inkscape:label'] !== "Planètes") {
        return
    }

    const planetes = JSON.parse(await fs.readFile('../data/content.json'))
    const planetesParse = Object.values(planetes.planet).reduce((acc, it) => {
        acc.set(it.id, { name: it.name, url: it.url });
        return acc
    }, new Map())
    const missingPlanete = []
    if (!group.a) {
        group.a = []
    }
    if (group.circle) {
        group.circle.forEach((it) => {
            console.log(planetesParse.get(itg.$.id).url)
            const a = { $: { class: 'path', hover: "fill:green" }, circle: [it] }
            if (planetesParse.has(it.$.id)) {
                it.title = [{ "_": planetesParse.get(it.$.id).name }]
                a.$.href = planetesParse.get(itg.$.id).url
            } else {
                missingPlanete.push(it.$.id)
            }
            a.circle = [it]
            group.a.push(a)
        })
        delete group.circle
    }
    if (group.a) {
        group.a.forEach((it) => {
            if (planetesParse.has(it.circle[0].$.id)) {
                it.$.href = planetesParse.get(it.circle[0].$.id).url
            }
        })
    }
    if (group.g) {
        group.g.forEach((itg) => {
            if (!itg.a) {
                const a = { $: { class: 'path', hover: "fill:green" } }
                if (planetesParse.has(itg.$.id)) {
                    itg.title = [{ "_": planetesParse.get(itg.$.id).name }]
                    a.$.href = planetesParse.get(itg.$.id).url
                } else {
                    missingPlanete.push(itg.$.id)
                }
                const keys = Object.keys(itg)
                keys.forEach(key => {
                    if (key !== '$' && key !== "title") {
                        a[key] = [...itg[key]]
                        delete itg[key]
                    }
                    delete itg[keys]
                })
                itg.a = [a]
            }
            if (planetesParse.has(itg.$.id)) {
                itg.a[0].$.href = planetesParse.get(itg.$.id).url
            }
        })
    }
    console.log(missingPlanete)
}

async function main() {
    const svg = await fs.readFile('../data/map.svg')
    const parser = new xml2js.Parser(/* options */);
    const svgInXml = await parser.parseStringPromise(svg)
    const route = {}
    const secteur = {}
    for (const group of svgInXml.svg.g) {
        await AddPlaneteTitle(group)
        if (group.$['inkscape:label'] === "Routes spatiales") {
            const planetes = JSON.parse(await fs.readFile('../data/content.json'))
            
            const planetesParse = Object.values(planetes.route).reduce((acc, it) => {
                acc.set(it.id, { name: it.name, url: it.url });
                return acc
            }, new Map())

            group.g.forEach(it => {
                it.g.forEach(it2 => {
                    it2.title = [{ "_": it2.$['inkscape:label'] }]
                    route[it2.$['inkscape:label']] = { name: it2.$['inkscape:label'], id: it2.$.id }
                    if (!it2.a || it2.a.length === 0) { 
                        it2.a = [{ $: { class: 'path', hover: "fill:green", href: "https://starwars.fandom.com/fr/wiki/Voie_Hydienne" }, path: [...it2.path] }]
                        it2.path = []
                    }
                    if (planetesParse.has(it2.$.id)) {
                        it2.a[0].$.href = planetesParse.get(it2.$.id).url
                    }
                })
            })
        } else if (group.$['inkscape:label'] === "Régions") {
            const planetes = JSON.parse(await fs.readFile('../data/content.json'))
            const planetesParse = Object.values(planetes.sector).reduce((acc, it) => {
                acc.set(it.id, { name: it.name, url: it.url });
                return acc
            }, new Map())
            group.g.forEach(it2 => {
                it2.title = [{ "_": it2.$['inkscape:label'] }]
                secteur[it2.$['inkscape:label']] = { name: it2.$['inkscape:label'], id: it2.$.id }
                if (!it2.a || it2.a.length === 0) {
                    const keys = Object.keys(it2)
                    const a = { $: { class: 'path', hover: "fill:green", href: "https://starwars.fandom.com/fr/wiki/Voie_Hydienne" } }

                    keys.forEach(key => {
                        if (key !== '$' && key !== "title") {
                            a[key] = [...it2[key]]
                            delete it2[key]
                        }
                    })
                    it2.a = [a]
                } 
                
                if (planetesParse.has(it2.$.id)) {
                    it2.a[0].$.href = planetesParse.get(it2.$.id).url
                }
            })
        }
    }

    console.log(`#############routeSecondaire#################`)
    console.log(JSON.stringify(route))
    console.log(JSON.stringify(secteur))
    console.log('###################################')

    const builder = new xml2js.Builder();
    const xml = builder.buildObject(svgInXml);
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
