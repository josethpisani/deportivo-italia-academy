with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.find('} else if(state.adminTab==="pruebas"){')
if idx >= 0:
    print('Found at index:', idx)
    print(repr(content[max(0,idx-100):idx+500]))