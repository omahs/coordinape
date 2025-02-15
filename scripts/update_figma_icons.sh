npx @svgr/cli --typescript  src/icons/figma --template ./src/icons/figma/svgr-template.js --svg-props css="{CSS_REPLACE}" --svg-props viewBox="0 0 16 16" --out-dir src/icons/__generated
sed -i '.bak' 's/\<svg/\<SvgIcon/g' src/icons/__generated/*.tsx
sed -i '.bak' 's/\<\/svg/\<\/SvgIcon/g' src/icons/__generated/*.tsx
sed -i '.bak' 's/{CSS_REPLACE}/\{\{ \.\.\.css, \.\.\.\(props\.css \?\? \{\}\) \}\}/g' src/icons/__generated/*.tsx
rm src/icons/__generated/*.bak