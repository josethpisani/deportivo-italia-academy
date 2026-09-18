with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()
idx = content.find('} else if(state.adminTab==="pruebas"){')
if idx >= 0:
    # Find the matching closing brace
    brace_count = 0
    for i in range(idx, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                print(f'End of block at index {i}')
                print(repr(content[max(0,i-50):i+200]))
                break