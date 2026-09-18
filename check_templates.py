with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check all template literals before line 303
for i, line in enumerate(lines[:303]):
    bt = line.count('`')
    if bt > 0:
        print(f'Line {i+1} (bt={bt}): {line.strip()[:100]}')