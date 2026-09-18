import os
import re

for root, dirs, files in os.walk('js'):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            imports = re.findall(r"from\s+['\"](\.[^'\"]+)['\"]", content)
            if imports:
                print(path + ': ' + str(imports))