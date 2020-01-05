import imba from 'imba/rollup.js';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import {terser} from 'rollup-plugin-terser';


export default [{
    input: './src/client.imba',
    output: [{
        file: './public/bundle.js',
        format: 'esm',
        name: 'bundle',
        sourcemap: true
    },{
        file: './public/bundle.min.js',
        format: 'esm',
        name: 'bundle',
        plugins: [terser()]
    }],
    plugins: [
        imba({target: 'web'}),
        replace({'process.env.NODE_ENV': '"production"'}),
        resolve({extensions: ['.imba2','.imba', '.mjs','.js','.json']}),
        commonjs()
    ]
},{
    input: './src/server.imba',
    output: {
        file: './src/server.bundle.js',
        format: 'cjs',
        name: 'bundle',
        sourcemap: 'inline'
    },
    external: function(id){
        return id[0] != '.' && id.indexOf('imba') != 0;
    },
    plugins: [
        imba({target: 'node'}),
        resolve({
            extensions: ['.imba','.imba2'],
            preferBuiltins: true
        }),
        commonjs()
    ]
}]