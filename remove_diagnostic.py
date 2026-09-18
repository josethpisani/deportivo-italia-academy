with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('<script>console.log("HTML loaded"); document.body.style.border="5px solid green";</script>', '')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Removed diagnostic script')