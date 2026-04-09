const fs = require('fs');
const path = 'c:/laragon/www/aiagent/src/components/icons/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace all instances of `export function XXIcon() {` 
// with `export function XXIcon({ size, className }: { size?: number, className?: string } = {}) {`
content = content.replace(/export function (\w+Icon)\(\) {/g, (match, name) => {
  if (name === 'WhatsAppIcon' || name === 'TelegramIcon') return match;
  return `export function ${name}({ size, className }: { size?: number, className?: string } = {}) {`;
});

// For each SVG tag, find width="XX" height="XX" and replace with width={size || XX} height={size || XX}
content = content.replace(/<svg\s+width="(\d+)"\s+height="(\d+)"\s+([^>]*)>/g, (match, w, h, rest) => {
  // also insert className={className} 
  if (rest.includes('className=')) {
    return `<svg width={size || ${w}} height={size || ${h}} ${rest}>`;
  }
  return `<svg width={size || ${w}} height={size || ${h}} className={className} ${rest}>`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
