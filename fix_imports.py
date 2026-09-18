import os
import re

def fix_imports(content, file_path):
    def replace_import(match):
        module = match.group(1)
        if module.startswith('./'):
            return f'from "/js/{module[2:]}"'
        elif module.startswith('../'):
            module_name = module.replace('../', '')
            if 'views' in file_path:
                return f'from "/js/views/{module_name}"'
            else:
                return f'from "/js/{module_name}"'
        return match.group(0)
    
    content = re.sub(r"from\s+['\"](\.[^'\"]+)['\"]", replace_import, content)
    return content

for root, dirs, files in os.walk('js'):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            new_content = fix_imports(content, path)
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Fixed: {path}')

print('Done fixing imports')