with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.find('} else if(state.adminTab==="pruebas"){')
if idx >= 0:
    # Print from the start of the block to the end
    print(content[idx:idx+2000])