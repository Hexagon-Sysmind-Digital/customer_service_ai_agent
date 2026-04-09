import re
content = open('c:/laragon/www/aiagent/src/components/icons/index.tsx').read()

def replace_icon(match):
    name = match.group(2)
    if 'WhatsAppIcon' in name or 'TelegramIcon' in name:
        return match.group(0) # already has size
    
    # Extract the original width and height to use as default if we want, but letting default be the original is good.
    w_match = re.search(r'width="(\d+)"', match.group(0))
    orig_w = w_match.group(1) if w_match else "18"
    
    # replace first line
    res = re.sub(r'export function ' + name + r'\(\)', f'export function {name}({{ size = {orig_w}, className }}: {{ size?: number, className?: string }} = {{}})', match.group(0))
    # replace width and height
    res = re.sub(r'width="\d+"', 'width={size}', res, count=1)
    res = re.sub(r'height="\d+"', 'height={size}', res, count=1)
    
    # inject className
    # find the end of the opening svg tag and insert className={className} before it
    res = res.replace('viewBox="0 0 24 24"', 'className={className} viewBox="0 0 24 24"')
    return res

new_content = re.sub(r'(export function (\w+Icon)\(\) \{([\s\S]*?)<\/svg>\n\})', replace_icon, content)

with open('c:/laragon/www/aiagent/src/components/icons/index.tsx', 'w') as f:
    f.write(new_content)
