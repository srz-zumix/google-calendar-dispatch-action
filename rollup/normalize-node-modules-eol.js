export default function normalizeNodeModulesEol() {
  return {
    name: 'normalize-node-modules-eol',
    transform(code, id) {
      if (!id.includes('node_modules')) return null
      if (!/\.(?:[cm]?js|ts)$/.test(id)) return null
      if (!code.includes('\r\n')) return null

      return {
        code: code.replace(/\r\n/g, '\n'),
        map: null
      }
    }
  }
}
