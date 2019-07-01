import { Config } from '@stencil/core'

export const config: Config = {
  namespace: 'example',
  devServer: {
    openBrowser: false,
  },
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'docs-readme',
    },
  ],
}
