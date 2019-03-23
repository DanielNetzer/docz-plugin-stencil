import { Config } from '@stencil/core'

export const config: Config = {
  namespace: 'mycomponent',
  outputTargets: [
    { type: 'dist', esmLoaderPath: '../docs/loader' },
    { type: 'docs' },
  ],
  devServer: {
    openBrowser: false,
  },
}
