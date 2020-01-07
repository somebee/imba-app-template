import * as fs from "fs";
import * as ts from "typescript";

const dir = '/Users/sindre/repos/hello-imba/.imba';
// const dir = "/Users/sindre/repos/hello-imba/src";

function watch(rootFileNames: string[], options: ts.CompilerOptions) {
  const files: ts.MapLike<{ version: number }> = {};

  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(rootFileNames, options);

  for (const sourceFile of program.getSourceFiles()) {
    
    if (!program.isSourceFileFromExternalLibrary(sourceFile) && !program.isSourceFileDefaultLibrary(sourceFile)) {
      console.log(sourceFile.fileName);
      // Walk the tree to search for classes
      // ts.forEachChild(sourceFile, visit);
      
    }
  }

  function fileExists(fileName: string): boolean {
    console.log('fileExists',fileName);
    return ts.sys.fileExists(fileName);
  }

  function readFile(fileName: string): string | undefined {
    console.log('readFile',fileName);
    return ts.sys.readFile(fileName);
  }

  function getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void) {
    const sourceText = ts.sys.readFile(fileName);
    return sourceText !== undefined
      ? ts.createSourceFile(fileName, sourceText, languageVersion)
      : undefined;
  }


  function resolveModuleNames(moduleNames: string[],containingFile: string): ts.ResolvedModule[] {
    const resolvedModules: ts.ResolvedModule[] = [];
    for (const moduleName of moduleNames) {
      console.log('resolve modules?',moduleName);

      // try to use standard resolution
      let result = ts.resolveModuleName(moduleName, containingFile, options, {
        fileExists,
        readFile
      });
      if (result.resolvedModule) {
        resolvedModules.push(result.resolvedModule);
      } else {
        
        // check fallback locations, for simplicity assume that module at location
        // should be represented by '.d.ts' file
        /*
        for (const location of moduleSearchLocations) {
          const modulePath = path.join(location, moduleName + ".d.ts");
          if (fileExists(modulePath)) {
            resolvedModules.push({ resolvedFileName: modulePath });
          }
        }*/
      }
    }
    return resolvedModules;
  }

  // initialize the list of files
  rootFileNames.forEach(fileName => {
    files[fileName] = { version: 0 };
  });

  // Create the language service host to allow the LS to communicate with the host
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => rootFileNames,
    getScriptVersion: fileName =>
      files[fileName] && files[fileName].version.toString(),

    getScriptSnapshot: fileName => {
      // console.log('get script',fileName);
      if (!fs.existsSync(fileName)) {
        return undefined;
      }
      // console.log('get snapshot',fileName);
      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCurrentDirectory: () => dir,
    getCompilationSettings: () => options,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: fileExists,
    readFile: readFile,
    readDirectory: ts.sys.readDirectory,
    resolveModuleNames: resolveModuleNames
  };

  // Create the language service files
  const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

  // Now let's watch the files
  rootFileNames.forEach(fileName => {
    // First time around, emit all files
    emitFile(fileName);

    // Add a watch on the file to handle next change
    fs.watchFile(fileName, { persistent: true, interval: 250 }, (curr, prev) => {
      // Check timestamp
      if (+curr.mtime <= +prev.mtime) {
        return;
      }

      // Update the version to signal a change in the file
      files[fileName].version++;

      // write the changes to disk
      emitFile(fileName);
    });
  });

  function emitFile(fileName: string) {
    console.log(`emitFile ${fileName}`);
    let output = services.getEmitOutput(fileName);

    if (!output.emitSkipped) {
      console.log(`Emitting ${fileName}`);
    } else {
      console.log(`Emitting ${fileName} failed`);
      logErrors(fileName);
    }

    output.outputFiles.forEach(o => {
        console.log('outputting files',o.name);
        // fs.writeFileSync(o.name, o.text, "utf8");
    });

    if(fileName.indexOf('main.js') >= 0){
      console.log('get completion here??');
      let completion = services.getCompletionsAtPosition(fileName,34,{});
      console.log(completion);
      let definition = services.getDefinitionAtPosition(fileName,34);
      console.log(definition);
      console.log(services.getDefinitionAtPosition(fileName,47));
    }
  }

  function logErrors(fileName: string) {
    let allDiagnostics = services
      .getCompilerOptionsDiagnostics()
      .concat(services.getSyntacticDiagnostics(fileName))
      .concat(services.getSemanticDiagnostics(fileName));

    allDiagnostics.forEach(diagnostic => {
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (diagnostic.file) {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start!
        );
        console.log(`  Error ${diagnostic.file.fileName} (${line + 1},${character +1}): ${message}`);
      } else {
        console.log(`  Error: ${message}`);
      }
    });
  }
}

// Initialize files constituting the program as all .ts files in the current directory
var currentDirectoryFiles = fs
  .readdirSync(dir)
  .filter(fileName => fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".js")
  .map(fileName => dir + '/' + fileName);

// Start the watcher
console.log(currentDirectoryFiles);

currentDirectoryFiles = ['/Users/sindre/repos/hello-imba/.imba/util.js']

const compilerOptions = {
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "declarationMap": true,
    "inlineSourceMap": true,
    "allowUnreachableCode": true,
    "target": ts.ScriptTarget.ES2016,
    // "declarationDir": "/Users/sindre/repos/hello-imba/src",
}

// { module: ts.ModuleKind.CommonJS }
watch(currentDirectoryFiles, compilerOptions);