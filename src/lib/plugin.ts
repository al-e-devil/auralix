import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"

type Plugin = {
    name: string
    disable: boolean
    path: string
    [key: string]: any
}

export default class Plugins {
    private pluginFilter: (file: string) => boolean
    public folder: string
    public plugins: Plugin[]

    constructor(folderPath: string = 'plugins') {
        this.pluginFilter = (file: string) => /\.js$/.test(file)
        this.folder = path.join(process.cwd(), folderPath)
        this.plugins = []
    }

    readPlugin = async (folder: string): Promise<void> => {
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

        const entries = fs.readdirSync(folder, { withFileTypes: true })
        const promises: Promise<void>[] = []

        for (const result of entries) {
            const _path = path.join(folder, result.name)
            if (result.isDirectory()) {
            logger.debug(`[PLUGIN] Entrando en subcarpeta: ${_path}`)
                promises.push(this.readPlugin(_path))
            }
            if (result.isFile()) {
                // Log para validar archivo encontrado
                console.log(`[PLUGIN] Encontrado archivo: ${_path}`)
                promises.push(this.loadPlugin(_path, result.name))
            }
        }

        await Promise.all(promises)
    }

    loadPlugin = async (_path: string, filename: string): Promise<void> => {
        if (!this.pluginFilter(filename)) return

        const url = pathToFileURL(_path).href
        const { default: plugin } = await import(url)

        if (plugin) {
            // Log para validar plugin cargado
            console.log(`[PLUGIN] Cargado plugin: ${filename} (${_path})`)
            this.plugins.push({
                name: filename,
                disable: false,
                ...plugin,
                path: _path
            })
        }
    }
}