import re, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'app/src/main/assets/index3d.html'
src = open(path, encoding='utf-8').read()
m = re.search(r'<script>(.*?)</script>', src, re.S)
if not m:
    print('Kein <script>-Block gefunden')
    sys.exit(1)
s = m.group(1)

stack = []
pairs = {')': '(', ']': '[', '}': '{'}
i = 0
line = 1
state = 'code'

while i < len(s):
    c = s[i]
    n = s[i + 1] if i + 1 < len(s) else ''
    if c == '\n':
        line += 1
    if state == 'line':
        if c == '\n':
            state = 'code'
        i += 1
        continue
    if state == 'block':
        if c == '*' and n == '/':
            state = 'code'
            i += 2
            continue
        i += 1
        continue
    if state in ('single', 'double'):
        if c == '\\':
            i += 2
            continue
        if (state == 'single' and c == "'") or (state == 'double' and c == '"'):
            state = 'code'
        i += 1
        continue
    if state == 'template':
        if c == '\\':
            i += 2
            continue
        if c == '`':
            state = 'code'
            i += 1
            continue
        if c == '$' and n == '{':
            stack.append(('{', line, 'template-expr'))
            state = 'code'
            i += 2
            continue
        i += 1
        continue
    if c == '/' and n == '/':
        state = 'line'
        i += 2
        continue
    if c == '/' and n == '*':
        state = 'block'
        i += 2
        continue
    if c == "'":
        state = 'single'
        i += 1
        continue
    if c == '"':
        state = 'double'
        i += 1
        continue
    if c == '`':
        state = 'template'
        i += 1
        continue
    if c in '([{':
        stack.append((c, line, state))
        i += 1
        continue
    if c in ')]}':
        if not stack:
            print(f'Unerwartetes {c} in Zeile {line}')
            sys.exit(1)
        opening, oline, origin = stack.pop()
        if opening != pairs[c]:
            print(f'Klammerfehler: {opening} (Zeile {oline}) passt nicht zu {c} (Zeile {line})')
            sys.exit(1)
        if c == '}' and origin == 'template-expr':
            state = 'template'
        i += 1
        continue
    i += 1

if stack:
    print('Nicht geschlossene Klammern:', stack[-5:])
    sys.exit(1)
if state != 'code':
    print('Unvollständiger Zustand:', state)
    sys.exit(1)
print('Klammern und Strings ausgeglichen; Zeilen:', s.count('\n') + 1)
