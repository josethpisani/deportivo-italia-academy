with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.find('} else if(state.adminTab==="pruebas"){')
if idx >= 0:
    with open('block_output.txt', 'w', encoding='utf-8') as f:
        f.write(content[idx:idx+2000])
    print('Written to block_output.txt')