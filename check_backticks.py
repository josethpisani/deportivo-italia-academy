with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()
# Count backticks
count = content.count('`')
print(f'Total backticks: {count}')
# Find positions
pos = 0
while True:
    pos = content.find('`', pos)
    if pos == -1:
        break
    print(f'Position {pos}: {repr(content[max(0,pos-20):pos+20])}')
    pos += 1