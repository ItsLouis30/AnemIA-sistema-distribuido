// Tipados globales para Webpack: variable de entorno y módulos CSS/estáticos.
declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_URL: string
  }
}

declare module '*.css'
declare module '*.png'
declare module '*.svg'
declare module '*.jpg'
