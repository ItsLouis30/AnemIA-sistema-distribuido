// ============================================================
//  AnemIA · Configuración de Webpack 5 (React + TypeScript + TSX)
//  Reemplaza por completo a Vite. Variable de entorno: REACT_APP_API_URL.
//
//  Nota de compatibilidad: Webpack reserva "!" para la sintaxis de loaders.
//  Como la ruta de este proyecto contiene "!" ("¡KEEP OUT!"), se evita el uso
//  de loaders que construyen peticiones con "!" (style-loader, css-loader,
//  html-webpack-plugin). Por eso:
//    * El CSS de Tailwind se compila aparte con la CLI (script "css") a
//      public/styles.css y se enlaza desde public/index.html (estático).
//    * El bundle se emite con nombre fijo (bundle.js) y se referencia
//      directamente desde el index.html estático.
//  En Docker la ruta es /app (sin "!") y todo funciona igual.
// ============================================================
const path = require('path')
const os = require('os')
const fs = require('fs')
const webpack = require('webpack')

// Carga sencilla de variables REACT_APP_* desde el .env ÚNICO de la raíz del
// proyecto (un nivel por encima de frontend/), sin dependencias externas.
function loadEnv() {
  const env = {}
  const file = path.resolve(__dirname, '..', '.env')
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

// Webpack reserva "!" en output.path. Si la ruta contiene "!", se usa un
// directorio temporal saneado para la salida (solo afecta a la ruta física;
// el bundle se sirve igual en "/bundle.js").
function safeOutputPath() {
  const target = path.resolve(__dirname, 'dist')
  if (!target.includes('!')) return target
  const fallback = path.join(os.tmpdir(), 'anemia_frontend_dist')
  // eslint-disable-next-line no-console
  console.warn(`\n[webpack] Ruta con "!"; salida en: ${fallback}\n`)
  return fallback
}

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production'
  const fileEnv = loadEnv()
  const apiUrl =
    process.env.REACT_APP_API_URL || fileEnv.REACT_APP_API_URL || 'http://localhost:8000'

  return {
    entry: './src/index.tsx',
    output: {
      path: safeOutputPath(),
      filename: 'bundle.js',
      // Los imports dinámicos (p. ej. jsPDF) se emiten como chunks aparte con
      // nombre estable y legible (sin hash, por la limitación del "!" en la
      // ruta). El Dockerfile copia TODO dist/, así que nginx los sirve en "/".
      chunkFilename: '[name].chunk.js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: { loader: 'ts-loader', options: { transpileOnly: true } },
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.REACT_APP_API_URL': JSON.stringify(apiUrl),
      }),
    ],
    devServer: {
      static: { directory: path.join(__dirname, 'public') },
      historyApiFallback: true, // soporte para rutas de React Router
      hot: false,
      allowedHosts: 'all', 
      // La ruta del proyecto contiene "!" (¡KEEP OUT!), carácter que Webpack
      // reserva como separador de loaders. webpack-dev-server inyecta su
      // "client" (recarga en vivo + overlay) por RUTA ABSOLUTA; al contener "!"
      // rompe la compilación ("Can't resolve 'H:\...KEEP OUT'"). Por eso se
      // desactivan client/liveReload: el servidor sirve la app igualmente y los
      // cambios se ven recargando el navegador (Ctrl/Cmd+R). En Docker (/app,
      // sin "!") pueden reactivarse. Producción (npm run build) no se ve afectada.
      client: false,
      liveReload: false,
      port: process.env.PORT || 3000,
      host: '0.0.0.0',
    },
    devtool: isProd ? 'source-map' : 'eval-source-map',
    performance: { hints: false },
  }
}
