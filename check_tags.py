import re

with open('src/app/components/TeacherDashboard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
div_count = 0
main_count = 0

for i, line in enumerate(lines):
    opens = len(re.findall(r'<div[\s>]', line))
    closes = len(re.findall(r'</div\s*>', line))
    div_count += opens
    div_count -= closes
    
    m_opens = len(re.findall(r'<main[\s>]', line))
    m_closes = len(re.findall(r'</main\s*>', line))
    main_count += m_opens
    main_count -= m_closes
    
    if main_count > 0 and div_count < 0:
        print(f"Negative div count at {i+1} : {line}")

print('Final Div:', div_count)
print('Final Main:', main_count)
