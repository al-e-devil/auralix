export default {
    name: "T",
    description: "Carga el menú de comandos",
    command: ["t"],
    exec: async (m: any, { sock }: { sock: any }) => {
        await sock.sendMessage(m.from, { text:"Word"})
    }
}