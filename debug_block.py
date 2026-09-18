with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('} else if(state.adminTab==="pruebas"){')
block = content[idx:idx+5000]

# Write to file for inspection
with open('debug_block.txt', 'w', encoding='utf-8') as f:
    f.write(block[:2000])
print('Written to debug_block.txt')