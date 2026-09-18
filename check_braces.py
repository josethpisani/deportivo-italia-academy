with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check brace balance in the pruebas block
idx = content.find('} else if(state.adminTab==="pruebas"){')
if idx >= 0:
    brace_count = 0
    in_string = False
    string_char = None
    for i in range(idx, len(content)):
        c = content[i]
        if not in_string:
            if c == '`':
                in_string = True
                string_char = '`'
            elif c == '{':
                pass
            elif c == '}':
                pass
        elif c == string_char and content[i-1] != '\\':
            in_string = False
            string_char = None
    
    # Simple check: count braces
    brace_count = 0
    for i in range(idx, min(idx+5000, len(content))):
        c = content[i]
        if c == '{':
            brace_count += 1
        elif c == '}':
            brace_count -= 1
            if brace_count == 0:
                print(f'Block ends at index {i}')
                print('Context:')
                print(content[max(0,i-50):i+100])
                break

print("Done")