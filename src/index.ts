import { createPlugin } from 'docz-core'
import * as fs from 'fs'
import * as path from 'path'

const OUTPUT_PATH = 'docs'

function fromDir(
  startPath: string,
  filter: RegExp,
  callback: (filename: string, err: any) => void
): void {
  if (!fs.existsSync(startPath)) {
    return
  }

  const files = fs.readdirSync(startPath)
  for (const file of files) {
    const filename = path.join(startPath, file)
    const stat = fs.lstatSync(filename)

    if (stat.isDirectory()) {
      fromDir(filename, filter, callback) // recurse
    } else if (filter.test(filename)) callback(filename, null)
  }
}

function getComponentsModules(startPath: string): string[] {
  if (!fs.existsSync(startPath)) {
    console.error(`Directory ${startPath} doesn't exist!`)
    return []
  }

  const componentPaths = fs
    .readdirSync(startPath)
    .map(f => path.join(startPath, f))
  return componentPaths
}

export interface DoczStencilPluginOptions {
  outputPath: string
}

export const stencil = (opts?: DoczStencilPluginOptions) => {
  const options = opts
    ? opts
    : {
        outputPath: OUTPUT_PATH,
      }

  return createPlugin({
    modifyFiles: files => {
      const componentsModules = getComponentsModules('src/components')
      componentsModules.forEach(cmpMdlPath => {
        const cmpName = path.parse(cmpMdlPath).name
        let mdContent: string[] = []
        let playgroundContent: string[] = []

        fromDir(cmpMdlPath, /\.md$/, (filenameWithPath, err) => {
          if (err) throw new Error(err)

          const filename = path.parse(filenameWithPath).base

          if (filename === 'playground') {
            playgroundContent = fs
              .readFileSync(filenameWithPath, { encoding: 'utf8' })
              .split('\n')
            return
          }

          if (filename === 'readme') {
            mdContent = fs
              .readFileSync(filenameWithPath, { encoding: 'utf8' })
              .split('\n')
            return
          }
        })

        const doczMdHeader = ['', '---', `name: ${cmpName}`, '---', '']
        let doczPGContent: string[] = []

        if (playgroundContent) {
          doczPGContent = [
            '',
            "import { Playground } from 'docz';",
            "import { defineCustomElements } from './loader';",
            'defineCustomElements(window);',
            '',
            '<Playground>',
            ...playgroundContent,
            '</Playground>',
            '',
          ]
        }

        mdContent.unshift(...doczMdHeader)

        // remove playground title
        const playGrndInsertionIndex = mdContent.findIndex(ctntLine =>
          ctntLine.includes('Auto Generated Below')
        )

        // insert the playground content
        mdContent.splice(playGrndInsertionIndex + 1, 0, ...doczPGContent)

        const doczMdxContent = mdContent.join('\n')

        // create new file with playground content, name it after the component name
        fs.writeFileSync(`${options.outputPath}/${cmpName}.mdx`, doczMdxContent)
      })
      return files
    },
    setConfig: config => {
      config.files = '**/*.mdx'
      config.codeSandbox = false
      config.typescript = true
      config.propsParser = false
      return config
    },
  })
}
