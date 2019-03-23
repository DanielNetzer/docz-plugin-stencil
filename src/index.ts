import { createPlugin } from "docz-core";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_PATH = "docs-copy";

function fromDir(
  startPath: string,
  filter: RegExp,
  callback: (filename: string) => void
) {
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);

    if (stat.isDirectory()) {
      fromDir(filename, filter, callback); //recurse
    } else if (filter.test(filename)) callback(filename);
  }
}

function getComponentsModules(startPath: string): string[] | undefined {
  if (!fs.existsSync(startPath)) {
    console.error(`Directory ${startPath} doesn't exist!`);
    return;
  }

  const componentPaths = fs
    .readdirSync(startPath)
    .map(f => path.join(startPath, f));
  return componentPaths;
}

export interface DoczStencilPluginOptions {
  outputPath: string;
}

export const stencil = (opts?: DoczStencilPluginOptions) => {
  const outputPath = opts.outputPath ? opts.outputPath : OUTPUT_PATH;
  return createPlugin({
    // modifyBundlerConfig: (config, dev, args) => {
    //   console.log("modifyBundlerConfig");
    //   return config;
    // },
    // modifyBabelRc: (babelrc, args) => {
    //   console.log("modifyBabelRc");
    //   return babelrc;
    // },
    // onServerListening: server => {
    //   console.log("onServerListening");
    // },
    // onPreBuild: () => {
    //   console.log("onPreBuild");
    // },

    // onPostBuild: args => {
    //   console.log("onPostBuild");
    // },
    // onPostRender: () => {
    //   console.log("onPostRender");
    // },
    // onPreRender: () => {
    //   console.log("onPreRender");
    // },
    // onCreateApp: app => {
    //   console.log("onCreateApp");
    // },
    modifyFiles: files => {
      console.log("modifyFiles");
      const componentsModules = getComponentsModules("src/components");
      componentsModules.forEach(cmpMdlPath => {
        let cmpName = cmpMdlPath.split("\\").pop();
        let mdContent: string[] = [];
        let playgroundContent: string[] = [];
        fromDir(cmpMdlPath, /\.md$/, filenameWithPath => {
          let filename = filenameWithPath
            .split("\\")
            .pop()
            .split(".")[0];

          if (filename === "playground") {
            playgroundContent = fs
              .readFileSync(filenameWithPath, { encoding: "utf8" })
              .split("\n");
            return;
          }

          if (filename === "readme") {
            mdContent = fs
              .readFileSync(filenameWithPath, { encoding: "utf8" })
              .split("\n");
            return;
          }
        });

        const doczMdHeader = ["", "---", `name: ${cmpName}`, "---", ""];
        const doczPGContent = [
          "",
          "import { Playground } from 'docz';",
          "import { defineCustomElements } from './loader';",
          "defineCustomElements(window);",
          "",
          "<Playground>",
          ...playgroundContent,
          "</Playground>",
          ""
        ];

        mdContent.unshift(...doczMdHeader);

        // remove playground title
        const playGrndInsertionIndex = mdContent.findIndex(ctntLine =>
          ctntLine.includes("Auto Generated Below")
        );

        // insert the playground content
        mdContent.splice(playGrndInsertionIndex + 1, 0, ...doczPGContent);

        const doczMdxContent = mdContent.join("\n");

        // create new file with playground content, name it after the component name
        fs.writeFileSync(`${outputPath}/${cmpName}.mdx`, doczMdxContent);
      });
      return files;
    },
    setConfig: config => {
      console.log("setConfig");
      config.files = '**/*.mdx';
      config.codeSandbox = false;
      config.typescript = true;
      config.propsParser = false;
      return config;
    }
  });
};
