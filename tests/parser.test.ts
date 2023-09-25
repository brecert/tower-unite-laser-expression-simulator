import { parse, parseBPExpr, parseProgram } from '../parser.js'
import { walk } from "https://deno.land/std@0.200.0/fs/walk.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { assertEquals } from "https://deno.land/std@0.202.0/assert/assert_equals.ts";

const expressionsDir = path.fromFileUrl(import.meta.resolve('./expressions'))
const astDir = path.fromFileUrl(import.meta.resolve('./.ast'))

async function readSources() {
    const sources = []
    for await (const walkEntry of walk(expressionsDir, { exts: ['expr'] })) {
        const source = await Deno.readTextFile(walkEntry.path)
        sources.push({ name: walkEntry.name, source })
    }
    return sources
}

const sources = await readSources()

Deno.test('parses expressions ok', async () => {
    for (let { name, source } of sources) {
        const parsed = parseProgram(source);
        assertEquals(parsed.errors, [])

        // TODO: automate this
        // Deno.writeTextFile(path.join(astDir, `${name}.json`), JSON.stringify(parsed, null, 2))

        const compiledFile = path.join(astDir, `${name}.json`)
        const compiled = await Deno.readTextFile(compiledFile).then(t => JSON.parse(t))
        assertEquals(compiled, parsed)
    }
})