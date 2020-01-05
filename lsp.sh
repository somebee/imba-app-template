imbac -o .imba --source-map src/
find src -name '*.d.ts' -type f -delete
tsc -p .imba
find src -name '*.d.ts' -maxdepth 2 -type f -exec sorcery -x -i {} \;