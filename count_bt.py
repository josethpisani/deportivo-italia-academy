with open('js/views/admin.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

total_bt = 0
for i, line in enumerate(lines[:303]):
    bt = line.count('`')
    if bt > 0:
        total_bt += bt
        print(f'Line {i+1} (bt={bt}): total_bt={total_bt}')

print(f'Total backticks up to line 303: {total_bt}')