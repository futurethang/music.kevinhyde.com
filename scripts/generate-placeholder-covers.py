import os, hashlib, math

OUT = '/home/user/music.kevinhyde.com/public/covers'
os.makedirs(OUT, exist_ok=True)

# Warm, desaturated, dark. The cover art carries the visuals, so these
# placeholders need to be distinct from each other without being loud.
SPECS = [
    ('floating-apart',        '#3c5668', '#d8e4ec', 'band'),
    ('harbor-light',          '#2c4a3a', '#cfe0c6', 'beam'),
    ('slack-tide',            '#4a4a44', '#d6d6cf', 'line'),
    ('low-ceiling',           '#2e2721', '#e0c79a', 'ceiling'),
    ('ninety-days-of-rain',   '#333847', '#c3cada', 'rain'),
    ('transom',               '#3a2e23', '#e8ccA4', 'transom'),
    ('field-recordings-vol-1','#2b3335', '#cbd6d2', 'scatter'),
    ('gale-warning',          '#3b342e', '#ead8bc', 'slash'),
    ('anodyne',               '#45423a', '#efe6cf', 'glow'),
    ('winterbourne',          '#28383d', '#cfe2e6', 'wash'),
    ('copper-harbor',         '#4a2f1d', '#e8a269', 'copper'),
    ('first-light',           '#26282b', '#e4ded2', 'dawn'),
]

def shapes(kind, fg):
    if kind == 'band':
        return f'<rect x="0" y="560" width="1400" height="170" fill="{fg}" opacity=".72" filter="url(#b)"/>'
    if kind == 'beam':
        return f'<rect x="610" y="140" width="180" height="1120" fill="{fg}" opacity=".66" filter="url(#b)"/>'
    if kind == 'line':
        return f'<rect x="150" y="700" width="1100" height="5" fill="{fg}" opacity=".9"/>'
    if kind == 'ceiling':
        return (f'<rect x="0" y="0" width="1400" height="760" fill="#000" opacity=".2"/>'
                f'<rect x="0" y="760" width="1400" height="90" fill="{fg}" opacity=".8" filter="url(#b)"/>')
    if kind == 'rain':
        out = []
        for i in range(90):
            x = (i * 157 + 40) % 1400
            y = (i * 311) % 700
            out.append(f'<rect x="{x}" y="{y}" width="2" height="{260 + (i*37)%420}" fill="{fg}" opacity=".45"/>')
        return ''.join(out)
    if kind == 'transom':
        return (f'<rect x="0" y="820" width="1400" height="580" fill="#000" opacity=".5"/>'
                f'<rect x="210" y="650" width="980" height="120" fill="{fg}" opacity=".72" filter="url(#b)"/>')
    if kind == 'scatter':
        out = []
        for i in range(34):
            h = hashlib.md5(f'scatter{i}'.encode()).digest()
            x, y, r = h[0] / 255 * 1240 + 80, h[1] / 255 * 1240 + 80, h[2] / 255 * 26 + 6
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="{fg}" opacity=".6"/>')
        return ''.join(out)
    if kind == 'slash':
        return f'<polygon points="120,1280 900,120 1070,120 290,1280" fill="{fg}" opacity=".6" filter="url(#b)"/>'
    if kind == 'glow':
        return f'<circle cx="700" cy="700" r="430" fill="url(#g2)"/>'
    if kind == 'wash':
        return f'<rect x="0" y="860" width="1400" height="540" fill="{fg}" opacity=".55" filter="url(#b)"/>'
    if kind == 'copper':
        return ''.join(
            f'<rect x="0" y="{200 + i*210}" width="1400" height="{70 - i*8}" fill="{fg}" opacity="{.75 - i*.09:.2f}"/>'
            for i in range(5))
    if kind == 'dawn':
        return f'<rect x="300" y="1030" width="800" height="4" fill="{fg}" opacity=".95"/>'
    return ''

for slug, bg, fg, kind in SPECS:
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1400" width="1400" height="1400" role="img">
<defs>
<filter id="b"><feGaussianBlur stdDeviation="46"/></filter>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="{bg}"/><stop offset="1" stop-color="#141210"/>
</linearGradient>
<radialGradient id="g2"><stop offset="0" stop-color="{fg}" stop-opacity=".7"/><stop offset="1" stop-color="{fg}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1400" height="1400" fill="url(#g)"/>
{shapes(kind, fg)}
</svg>'''
    open(os.path.join(OUT, f'{slug}.svg'), 'w').write(svg)

print(f'{len(SPECS)} covers written')
