import os
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
old = '<script type="module" src="/js/app.js"></script>'
new = '<script>console.log("HTML loaded"); document.body.style.border="5px solid green";</script><script type="module" src="/js/app.js"></script>'
content = content.replace(old, new)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')