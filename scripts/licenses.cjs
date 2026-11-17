'use strict'

const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
const lines = ['# Composants tiers', '', 'Inventaire généré depuis les lockfiles avec `node scripts/licenses.cjs`.', '',
    'Le code original conserve ses droits réservés. Chaque composant tiers conserve sa licence. Les textes disponibles dans les paquets installés sont rassemblés dans THIRD_PARTY_LICENSES.txt. Les paquets optionnels absents de cette plateforme restent à contrôler dans la plateforme de distribution.', '']
const texts = []
for (const group of ['front', 'back']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, group, 'package.json'), 'utf8'))
    const lock = JSON.parse(fs.readFileSync(path.join(root, group, 'package-lock.json'), 'utf8'))
    lines.push(`## ${group} — dépendances directes`, '', '| Paquet | Version verrouillée | Licence déclarée | Usage |', '| --- | --- | --- | --- |')
    for (const [name, range] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies }).sort()) {
        const item = lock.packages[`node_modules/${name}`] || {}
        lines.push(`| ${name} | ${item.version || range} | ${item.license || 'À vérifier'} | ${manifest.dependencies?.[name] ? 'Exécution' : 'Développement'} |`)
    }
    lines.push('')
    for (const [key, item] of Object.entries(lock.packages)) {
        if (!key || item.dev) continue
        const directory = path.join(root, group, key)
        if (!fs.existsSync(directory)) continue
        for (const name of fs.readdirSync(directory)) {
            if (!/^(licen[cs]e|copying|notice)(\.|$)/i.test(name)) continue
            const file = path.join(directory, name)
            if (fs.statSync(file).isFile()) texts.push(`${group}/${key} — ${item.version} — ${name}\n${fs.readFileSync(file, 'utf8')}`)
        }
    }
}
lines.push('## Ressources visuelles et polices', '',
    '- Fraunces, Plus Jakarta Sans et Architects Daughter : SIL OFL 1.1, chargées via Google Fonts. Les fichiers de police ne sont pas inclus dans ce dépôt.',
    '- Icônes : Lucide (ISC), avec notices MIT pour les éléments provenant de Feather ; conserver les notices du paquet.',
    '- Illustrations et logo du site : génération par IA selon le dossier de projet. Exclure les croquis tiers sans droits des exemples publics et des captures du jury.', '',
    'Les composants natifs de Sharp/libvips et leurs notices embarquées nécessitent un contrôle propre à la plateforme effectivement distribuée. Cet inventaire ne remplace pas cette vérification.', '')
fs.mkdirSync(path.join(root, 'docs'), { recursive: true })
fs.writeFileSync(path.join(root, 'docs/THIRD_PARTY_NOTICES.md'), lines.join('\n'))
fs.writeFileSync(path.join(root, 'docs/THIRD_PARTY_LICENSES.txt'), texts.join('\n\n========================================\n\n'))
console.log(`Inventaire généré ; ${texts.length} fichiers de licence/notice conservés.`)
