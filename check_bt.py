with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.find('} else if(state.adminTab==="pruebas"){')
block = content[idx:]
print('Total length from pruebas:', len(block))
bt_count = block.count('`')
print('Backticks in block:', bt_count)

# Find all backtick positions
pos = 0
while True:
    pos = block.find('`', pos)
    if pos == -1:
        break
    print(f'Position {pos}: {repr(block[max(0,pos-30):pos+30])}')
    pos += 1