import Plugins from "./lib/plugin"

const config = {
    owner: {
        number: "51968374620"
    },
    bot: {
        name: "Auralix",
        author: "Alexito",
        version: "1.0.0-preview"
    },
    mods: [],
    prefix: ["@"]
}

const plugin = new Plugins('src/plugins')
export const pluginsReady = plugin.readPlugin(plugin.folder).then(() => plugin.plugins)
export const plugins = plugin.plugins

export default config