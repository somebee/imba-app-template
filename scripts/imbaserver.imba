var fs = require 'fs'
var ts = require 'typescript'

var imbac = require('imba/dist/compiler.js')

var imbaOptions = {
	target: 'node'
	imbaPath: null
	sourceMap: {}
}

const dir = '/Users/sindre/repos/hello-imba/src'

class ImbaFile
	def constructor o
		@jsPath = o
		@imbaPath = o.replace(/\.js$/,'.imba')

class ImbaProgram


def watch(rootFileNames, options)
	var files = {}
	var js2imba = {}
	var imbaFiles = {}

	def sourceFileExists(fileName)
		var alt = fileName.replace(/\.js$/, '.imba')

		if alt != fileName && ts.sys.fileExists(alt)
			console.log('fileExists!', fileName, alt)
			js2imba[fileName] = alt
			return true

		return false
	
	def fileExists(fileName) 
		sourceFileExists(fileName) || ts.sys.fileExists(fileName)
	
	def readFile(fileName)
		var source = js2imba[fileName]
		if source
			var body = ts.sys.readFile(source)
			var res = imbac.compile(body,imbaOptions)
			console.log('read compiled file!', res.js)
			return res.js

		return ts.sys.readFile(fileName)

	// initialize the list of files
	for fileName in rootFileNames
		files[fileName] = { version: 0 }

	// Create the language service host to allow the LS to communicate with the host
	var servicesHost = {
		getScriptFileNames: do return rootFileNames
		getScriptVersion: do |fileName|
			return files[fileName] && files[fileName].version.toString()

		getScriptSnapshot: do |fileName|
			return undefined if !fileExists(fileName)
			return ts.ScriptSnapshot.fromString(readFile(fileName).toString())
		
		getCurrentDirectory: do dir
		getCompilationSettings: do options
		getDefaultLibFileName: do |options| ts.getDefaultLibFilePath(options)
		fileExists: fileExists
		readFile: readFile
		readDirectory: ts.sys.readDirectory
	}

	// Create the language service files
	var services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
	// Now let's watch the files
	for fileName in rootFileNames
		emitFile(fileName)
		// Add a watch on the file to handle next change
		fs.watchFile(fileName, { persistent: true, interval: 250 }) do |curr,prev|
			if +curr.mtime <= +prev.mtime
				return
			// Update the version to signal a change in the file
			files[fileName].version++
			// write the changes to disk
			emitFile(fileName)

	def emitFile(fileName)
		console.log("emitFile " + fileName)
		var output = services.getEmitOutput(fileName)
		if !output.emitSkipped
			console.log("Emitting " + fileName)
		else
			console.log("Emitting " + fileName + " failed")
			logErrors(fileName)

		if fileName.indexOf('main.js') >= 0
			console.log('get completion here??')
			var completion = services.getCompletionsAtPosition(fileName, 34, {})
			console.log(completion)
			var definition = services.getDefinitionAtPosition(fileName, 34)
			console.log(definition);
			console.log(services.getDefinitionAtPosition(fileName, 47))


	def logErrors(fileName)
		var allDiagnostics = services
			.getCompilerOptionsDiagnostics()
			.concat(services.getSyntacticDiagnostics(fileName))
			.concat(services.getSemanticDiagnostics(fileName))

		for diagnostic in allDiagnostics
			var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
			if diagnostic.file
				var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character
				console.log("  Error " + diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message)
			else
				console.log("  Error: " + message)


var roots = ['/Users/sindre/repos/hello-imba/src/main.js']

var compilerOptions = {
	"allowJs": true,
	"checkJs": false,
	"declaration": true,
	"emitDeclarationOnly": true,
	"declarationMap": true,
	"inlineSourceMap": true,
	"allowUnreachableCode": true,
	"target": ts.ScriptTarget.ES2016
};

watch(roots, compilerOptions);