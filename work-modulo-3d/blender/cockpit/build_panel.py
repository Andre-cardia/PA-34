"""Painel fiel à foto PR-FLM (spec-painel-fiel-prflm, etapa E2). Nunca abre/importa/salva o avião.
Blender --background --python-exit-code 1 --python .../build_panel.py

Toda a geometria vem de panel-map.json (exportado de panel-data.ts/artwork.tsx por
export-map.mjs): hotspots, chapas, faixa creme, pedestal, placas, fixadores e manches.
Nenhuma coordenada de layout é escrita à mão aqui; só alturas (Z) e acabamentos.
"""
import bpy
import bmesh
import json
import math
import hashlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = Path(__file__).resolve().parent
def fingerprint(file):
    data = (HERE / file).read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

provenance = json.loads((HERE / 'masters/atlas-provenance.json').read_text())
def verify_inputs():
    for file, expected in {**provenance['sources'], **provenance['atlases']}.items():
        assert fingerprint(file) == expected, f'Atlas/fonte obsoleto: {file}'
verify_inputs()
MAP = json.loads((HERE / 'panel-map.json').read_text())
GEO = MAP['geometry']
PL = GEO['plates']
W, H = MAP['width'], MAP['height']
N = len(MAP['instruments'])
S = 0.01
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices: d.use = True
    scene.cycles.device = 'GPU' if any(d.type == 'METAL' for d in prefs.devices) else 'CPU'
except Exception:
    scene.cycles.device = 'CPU'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = W * 2
scene.render.resolution_y = H * 2
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('Ambiente exclusivo do painel')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.22, .25, .30, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35

def srgb(hexcolor):
    h = hexcolor.lstrip('#')
    c = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in c)

def mat(name, color, metal=0, rough=.4, grain=False, coat=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes
    p = n.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if coat and 'Coat Weight' in p.inputs:
        p.inputs['Coat Weight'].default_value = coat
    if grain:
        noise = n.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 320
        bump = n.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .22
        bump.inputs['Distance'].default_value = .003
        m.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        m.node_tree.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m

# Cores medidas na foto PR-FLM: chapa preta acetinada, faixa e pedestal creme.
plate = mat('Chapa preta acetinada • microtextura', srgb('#1B1C1D'), .25, .48, True)
plate_sub = mat('Subchapa preta rebaixada', srgb('#131415'), .2, .5, True)
strip = mat('Faixa de anunciadores preta', srgb('#151617'), .2, .42, True)
cream = mat('Faixa creme acetinada em relevo', srgb('#A49C8C'), .05, .5, True)
cream_dark = mat('Forro creme lateral', srgb('#8E8574'), .02, .62, True)
cream_shade = mat('Degrau creme sombreado', srgb('#6E675A'), .02, .6, True)
metal = mat('Alumínio escovado', srgb('#8C8E90'), .9, .26)
chrome = mat('Cromado', srgb('#D8D8D4'), 1, .12)
black = mat('Borracha e baquelite', srgb('#0E0F0F'), .05, .32, True)
bezel = mat('Aros pretos anodizados', srgb('#1A1B1A'), .7, .24)
pad = mat('Acolchoado do glareshield', srgb('#0B0B0B'), 0, .62, True)
silver = mat('Puxadores prata', srgb('#C9C8C2'), .8, .22)
white = mat('Teclas brancas', srgb('#E3E2DC'), 0, .35)
lever = {
    'manetes_potencia': mat('Manete de potência preta', srgb('#141414'), .1, .25, coat=.6),
    'manetes_helice': mat('Manete de hélice azul', srgb('#3E7BE0'), .05, .3, coat=.6),
    'manetes_mistura': mat('Manete de mistura vermelha', srgb('#D81F26'), .05, .3, coat=.6),
}
maroon = mat('Puxador vinho', srgb('#6E2D24'), .05, .35, coat=.4)
brown = mat('Puxador marrom', srgb('#4A2A1A'), .05, .4)
yoke_black = mat('Manche preto brilhante', srgb('#121722'), .1, .22, coat=.8)
yoke_hub = mat('Cubo do manche', srgb('#0D1220'), .1, .28, coat=.6)
piper_blue = mat('Logo Piper azul', srgb('#22336B'), 0, .3)
piper_white = mat('Logo Piper branco', srgb('#E9E8E2'), 0, .3)
piper_red = mat('Logo Piper vermelho', srgb('#C8202A'), 0, .3)
ring_silver = mat('Frisos do cubo', srgb('#C9CED8'), .9, .2)

# O vidro usa reflexão real muito discreta, sem apagar os números.
glass = bpy.data.materials.new('Vidro • reflexo frontal sutil')
glass.use_nodes = True
n = glass.node_tree.nodes
n.clear()
out = n.new('ShaderNodeOutputMaterial')
transparent = n.new('ShaderNodeBsdfTransparent')
glossy = n.new('ShaderNodeBsdfGlossy')
glossy.inputs['Color'].default_value = (.55, .65, .72, 1)
glossy.inputs['Roughness'].default_value = .12
mix = n.new('ShaderNodeMixShader')
mix.inputs[0].default_value = .06
glass.node_tree.links.new(transparent.outputs[0], mix.inputs[1])
glass.node_tree.links.new(glossy.outputs[0], mix.inputs[2])
glass.node_tree.links.new(mix.outputs[0], out.inputs[0])

collection_panel = bpy.data.collections.new('Painel')
collection_yokes = bpy.data.collections.new('Manches (camada opcional)')
scene.collection.children.link(collection_panel)
scene.collection.children.link(collection_yokes)
target = [collection_panel]

def link(o):
    for c in o.users_collection: c.objects.unlink(o)
    target[0].objects.link(o)
    return o

def finish(o, name, material, smooth=False):
    o.name = name
    o.data.materials.clear()
    o.data.materials.append(material)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    return link(o)

def cube(name, x, y, w, h, z, depth, material, bevel_width=2):
    """Caixa centrada em (x, y) canônicos; z = centro da espessura."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x*S, -y*S, z*S))
    o = bpy.context.object
    o.dimensions = (w*S, h*S, depth*S)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel_width = min(bevel_width, w/2.2, h/2.2, depth/2.2)
    if bevel_width > .05:
        b = o.modifiers.new('Bordas usinadas', 'BEVEL')
        b.width = bevel_width*S
        b.segments = 3
        o.modifiers.new('Normais de chapa', 'WEIGHTED_NORMAL')
    return finish(o, name, material)

def box(name, x, y, w, h, z0, z1, material, bevel_width=2):
    return cube(name, x+w/2, y+h/2, w, h, (z0+z1)/2, z1-z0, material, bevel_width)

def cylinder(name, x, y, r, z0, z1, material, vertices=64):
    depth = z1-z0
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=r*S, depth=depth*S, location=(x*S, -y*S, (z0+z1)/2*S))
    o = bpy.context.object
    b = o.modifiers.new('Borda arredondada', 'BEVEL')
    b.width = min(1.2, depth/3, r/3)*S
    b.segments = 3
    o.modifiers.new('Normais', 'WEIGHTED_NORMAL')
    return finish(o, name, material)

def sphere(name, x, y, r, z, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=r*S, location=(x*S, -y*S, z*S))
    return finish(bpy.context.object, name, material, True)

def ring(name, x, y, r, z, tube_r, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=(r-tube_r)*S, minor_radius=tube_r*S, major_segments=72, minor_segments=12, location=(x*S, -y*S, z*S))
    return finish(bpy.context.object, name, material, True)

def clean(points):
    pts = []
    for p in points:
        p = (float(p[0]), float(p[1]))
        if not pts or math.dist(pts[-1], p) > 1e-6: pts.append(p)
    if len(pts) > 2 and math.dist(pts[0], pts[-1]) < 1e-6: pts.pop()
    # Em coordenadas Blender (Y invertido) a ordem anti-horária dá normal +Z.
    area = sum(x0*(-y1) - x1*(-y0) for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]))
    return pts if area > 0 else list(reversed(pts))

def prism(name, points, z0, z1, material, bevel_width=0):
    """Polígono canônico extrudado entre z0 e z1 (normais explícitas)."""
    pts = clean(points)
    bm = bmesh.new()
    bottom = [bm.verts.new((x*S, -y*S, z0*S)) for x, y in pts]
    top = [bm.verts.new((x*S, -y*S, z1*S)) for x, y in pts]
    bm.faces.new(top)
    bm.faces.new(list(reversed(bottom)))
    for i in range(len(pts)):
        j = (i+1) % len(pts)
        bm.faces.new([bottom[i], bottom[j], top[j], top[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    o = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(o)
    if bevel_width:
        b = o.modifiers.new('Acabamento de borda', 'BEVEL')
        b.width = bevel_width*S
        b.segments = 3
        b.limit_method = 'ANGLE'
        o.modifiers.new('Normais', 'WEIGHTED_NORMAL')
    return finish(o, name, material)

def tube(name, points, radius, z, material, cyclic=False, flatten=1.0):
    c = bpy.data.curves.new(name, 'CURVE')
    c.dimensions = '3D'
    c.bevel_depth = radius*S
    c.bevel_resolution = 4
    line = c.splines.new('POLY')
    line.points.add(len(points)-1)
    for p, (x, y) in zip(line.points, points):
        p.co = (x*S, -y*S, 0, 1)
    line.use_cyclic_u = cyclic
    o = bpy.data.objects.new(name, c)
    o.location.z = z*S
    o.scale.z = flatten
    scene.collection.objects.link(o)
    o.data.materials.append(material)
    return link(o)

def rrect(x, y, w, h, rx, n=6):
    rx = min(rx, w/2, h/2)
    pts = []
    for cx, cy, a0 in [(x+w-rx, y+rx, -90), (x+w-rx, y+h-rx, 0), (x+rx, y+h-rx, 90), (x+rx, y+rx, 180)]:
        for i in range(n+1):
            a = math.radians(a0 + 90*i/n)
            pts.append((cx + rx*math.cos(a), cy + rx*math.sin(a)))
    return pts

def circle_pts(x, y, r, n=96):
    return [(x + r*math.cos(a*math.tau/n), y + r*math.sin(a*math.tau/n)) for a in range(n)]

def screw(x, y, z, r=3):
    cylinder('Fixador de fenda', x, y, r, z, z+1.5, metal)
    cube('Fenda do fixador', x, y, r*1.35, .6, z+1.6, .25, black, .1)

def inside(x, y, poly):
    inside_ = False
    j = len(poly)-1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj-xi)*(y-yi)/(yj-yi)+xi: inside_ = not inside_
        j = i
    return inside_

# Alturas (unidades canônicas): chapa 0; subchapas 1; faixa escura 2; faixa creme 10;
# console lateral 12; pedestal 18. Os mesmos polígonos do fallback vetorial.
Z_PLATE, Z_SUB, Z_STRIP, Z_CREAM, Z_CONSOLE, Z_PED = 0, 1, 2, 10, 12, 18
def surface(x, y):
    if inside(x, y, PL['pedestal']): return Z_PED
    if inside(x, y, PL['faixaCreme']): return Z_CREAM
    if inside(x, y, PL['consoleLateral']): return Z_CONSOLE
    if inside(x, y, PL['faixaEscura']): return Z_STRIP
    if any(inside(x, y, PL[k]) for k in ['sixpack', 'copiloto', 'stack']): return Z_SUB
    return Z_PLATE

def seat(x0, y0, x1, y1):
    # Assento do corpo: a superfície mais alta sob a sua área (grade 5×5).
    return max(surface(x0+(x1-x0)*i/4, y0+(y1-y0)*j/4) for i in range(5) for j in range(5))

# ---- Chapas: contorno do glareshield, subchapas, faixa escura, faixa creme, pedestal ----
prism('Parede lateral esquerda creme', PL['paredeEsq'], -22, -6, cream_dark, 2)
prism('Parede lateral direita creme', PL['paredeDir'], -22, -6, cream_dark, 2)
prism('Chapa frontal preta • contorno do glareshield', PL['painel'], -14, Z_PLATE, plate, 3)
def clip(subject, clipper):
    # Sutherland–Hodgman: recorta as subchapas pelo contorno (convexo) da chapa,
    # como o clipPath do fallback vetorial.
    cl = clean(clipper)
    out = clean(subject)
    def side(a, b, p): return (b[0]-a[0])*(-(p[1]-a[1])) - (-(b[1]-a[1]))*(p[0]-a[0])
    for a, b in zip(cl, cl[1:] + cl[:1]):
        inp, out = out, []
        for p, q in zip(inp, inp[1:] + inp[:1]):
            sp, sq = side(a, b, p), side(a, b, q)
            if sp >= 0: out.append(p)
            if (sp >= 0) != (sq >= 0):
                t = sp/(sp-sq)
                out.append((p[0]+(q[0]-p[0])*t, p[1]+(q[1]-p[1])*t))
    return out
for key_, label in [('sixpack', 'Subchapa rebaixada do six-pack'), ('copiloto', 'Subchapa do copiloto'), ('stack', 'Baia do stack de rádios')]:
    prism(label, clip(PL[key_], PL['painel']), Z_PLATE, Z_SUB, plate_sub, .6)
# Acolchoado: tubo achatado sobre o contorno, abaixo dos instrumentos (que o sobrepõem
# como no fallback vetorial), sem ocultar nenhum hotspot.
# Topo do acolchoado em z≈0,4: acima da chapa, abaixo das placas (z 0,6+) e dos
# instrumentos — mesma ordem de pintura do fallback vetorial.
tube('Acolchoado do glareshield', GEO['pad'], 17, -3, pad, flatten=.2)
prism('Faixa escura de anunciadores', PL['faixaEscura'], Z_PLATE, Z_STRIP, strip, .8)
for x0, x1, y in GEO['trims']:
    box('Friso cromado', x0, y-2.5, x1-x0, 5, Z_STRIP, Z_STRIP+2.2, chrome, .8)
prism('Faixa inferior creme em relevo', PL['faixaCreme'], Z_PLATE, Z_CREAM, cream, 2.5)
prism('Pedestal creme • quadrante e cowl flap', PL['pedestal'], Z_PLATE, Z_PED, cream, 3)
prism('Degrau do pedestal (cowl flap)', PL['pedestalDegrau'], Z_PED, Z_PED+1, cream_shade, .5)
prism('Console lateral esquerdo creme', PL['consoleLateral'], -6, Z_CONSOLE, cream, 2.5)
for x, y in GEO['screws']:
    screw(x, y, surface(x, y))

# ---- Atlas: serigrafia com alfa, aplicada por decalques no próprio corpo ----
textures = {}
for light in ['dia', 'noite']:
    image = bpy.data.images.load(str(HERE / f'masters/serigrafia-{light}.png'))
    image.pack()
    m = mat('Serigrafia ' + light, (.06, .06, .06), 0, .6)
    p = m.node_tree.nodes.get('Principled BSDF')
    tex = m.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    tex.interpolation = 'Cubic'
    m.node_tree.links.new(tex.outputs['Color'], p.inputs['Base Color'])
    m.node_tree.links.new(tex.outputs['Color'], p.inputs['Emission Color'])
    m.node_tree.links.new(tex.outputs['Alpha'], p.inputs['Alpha'])
    p.inputs['Emission Strength'].default_value = .3 if light == 'dia' else .9
    textures[light] = m

faces = []
def decal(name, points, z, material=None):
    pts = clean(points)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x*S, -y*S, z*S) for x, y in pts], [], [list(range(len(pts)))])
    mesh.update()
    uv = mesh.uv_layers.new(name=f'Coordenadas canônicas {W}x{H}')
    for loop in mesh.loops:
        x, y = pts[loop.vertex_index]
        uv.data[loop.index].uv = (x/W, 1-y/H)
    o = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(o)
    if material is None:
        finish(o, name, textures['dia'])
        faces.append(o)
    else:
        finish(o, name, material)
    return o

def rect_pts(x, y, w, h):
    return [(x, y), (x+w, y), (x+w, y+h), (x, y+h)]

# Placas impressas (texto da foto), horímetro e placa da base do pedestal.
for i, pl in enumerate(GEO['placards']):
    z = surface(pl['x']+pl['w']/2, pl['y']+pl['h']/2)
    box(f'Placa {i+1:02d} • chapa', pl['x'], pl['y'], pl['w'], pl['h'], z, z+.6, black, .2)
    decal(f'Placa {i+1:02d} • impressão', rect_pts(pl['x']-1, pl['y']-1, pl['w']+2, pl['h']+2), z+.7)
hm = GEO['horimetro']
hp = hm['plate']
zh = surface(hm['cx'], hm['cy'])
box('Horímetro • placa', hp['x'], hp['y'], hp['w'], hp['h'], zh, zh+2, bezel, 1.5)
cylinder('Horímetro • caixa', hm['cx'], hm['cy'], hm['r'], zh+2, zh+5, black)
decal('Horímetro • mostrador impresso', rect_pts(hp['x']-1, hp['y']-1, hp['w']+2, hp['h']+2), zh+5.2)
decal('Horímetro • vidro', circle_pts(hm['cx'], hm['cy'], hm['r']-4), zh+6, glass)
pb = GEO['pedestalBase']
decal('Base do pedestal • placa impressa', rect_pts(pb['placa']['x']-1, pb['placa']['y']-1, pb['placa']['w']+2, pb['placa']['h']+2), Z_PED+.4)
a = pb['alavanca']; box('Base do pedestal • alavanca', a['x'], a['y'], a['w'], a['h'], Z_PED, Z_PED+12, black, 5)
a = pb['punho']; box('Base do pedestal • punho', a['x'], a['y'], a['w'], a['h'], Z_PED+12, Z_PED+16, metal, 3)

# ---- Instrumentos: um corpo medido por ID, mais volumes alinhados à arte ----
CREAM_GAUGES = {'pressao_admissao', 'tacometro_duplo', 'tacometro_direito', 'quantidade_combustivel'}
def decal_ring(name, x, y, r0, r1, z, n=96):
    # Coroa impressa fora do aro (legendas como "TURN" sob o mostrador).
    mesh = bpy.data.meshes.new(name)
    verts = [(x + rr*math.cos(a*math.tau/n), y + rr*math.sin(a*math.tau/n)) for rr in (r0, r1) for a in range(n)]
    quads = [(i, n+i, n+(i+1) % n, (i+1) % n) for i in range(n)]
    mesh.from_pydata([(vx*S, -vy*S, z*S) for vx, vy in verts], [], quads)
    mesh.update()
    for poly in mesh.polygons:
        if poly.normal.z < 0: poly.flip()
    uv = mesh.uv_layers.new(name=f'Coordenadas canônicas {W}x{H}')
    for loop in mesh.loops:
        vx, vy = verts[loop.vertex_index]
        uv.data[loop.index].uv = (vx/W, 1-vy/H)
    o = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(o)
    finish(o, name, textures['dia'])
    faces.append(o)
    return o

def gauge(id, x, y, r, z, rim=None, measured=True):
    decal_ring(id+' • legenda externa', x, y, r-.5, r+9, z+.15)
    body = cylinder(id + (' • corpo' if measured else ' • mostrador'), x, y, r, z, z+6, bezel)
    ring(id+' • aro', x, y, r, z+6.5, 2.1, rim or bezel)
    ring(id+' • vedação', x, y, r-3, z+6, 1.5, black)
    decal(id+' • mostrador impresso', circle_pts(x, y, r-4.5), z+6.2)
    decal(id+' • vidro', circle_pts(x, y, r-4.5), z+7.4, glass)
    for ang in [45, 135, 225, 315]:
        t = math.radians(ang)
        screw(x+(r-1)*math.cos(t), y+(r-1)*math.sin(t), z+8.4, 1.4)
    return body

def knob(id, x, y, r, z, material=black, h=5):
    cylinder(id+' • botão', x, y, r, z, z+h, material)

OPEN_ART = {'ar_alternativo', 'cowl_flaps', 'estatica_alternada', 'extensao_emergencia_trem', 'seletor_trem'}
bodies = {}
for e in MAP['instruments']:
    s = e['shape']; id = e['id']
    if s['kind'] == 'circle':
        cx, cy, r = s['cx'], s['cy'], s['r']
        z = seat(cx-r*.7, cy-r*.7, cx+r*.7, cy+r*.7)
        if id == 'aviso_estol':
            # Luz redonda embutida: bisel plástico fino e lente impressa.
            bodies[id] = cylinder(id+' • bisel', cx, cy, r, z, z+4, black)
            decal(id+' • lente impressa', circle_pts(cx, cy, r-.5, 48), z+4.2)
            continue
        bodies[id] = gauge(id, cx, cy, r, z, metal if id in CREAM_GAUGES else None)
        continue
    x, y, w, h = s['x'], s['y'], s['w'], s['h']
    z = seat(x, y, x+w, y+h)
    if id == 'instrumentos_copiloto':
        # Subchapa medida do jogo do copiloto (visível, dentro do contorno da chapa);
        # os seis mostradores reais por cima.
        bodies[id] = box(id+' • volume do conjunto', x, y, w, h, z, z+1.2, plate_sub, .6)
        for part in e.get('parts', []):
            gauge(id, part['cx'], part['cy'], part['r'], z+1.2, measured=False)
        continue
    depth = 6 if min(w, h) >= 20 else 4
    # Comandos cuja arte não preenche o retângulo ficam sobre um ressalto da cor
    # da superfície (creme no pedestal/faixa), como na foto; os demais, caixa preta.
    body_mat = cream if id in OPEN_ART and z >= Z_CREAM else bezel
    bodies[id] = box(id+' • caixa', x, y, w, h, z, z+depth, body_mat, 3 if min(w, h) >= 30 else 1.2)
    top = z+depth
    decal(id+' • impressão', rect_pts(x+.5, y+.5, w-1, h-1), top+.15)
    if min(w, h) >= 30:
        for sx in [x+4, x+w-4]:
            for sy in [y+4, y+h-4]: screw(sx, sy, top+.3, 1.5)
    cx = x+w/2
    if id in lever:
        for i in range(2):
            lx = x+6+i*((w-12)/2); lw = (w-12)/2-4
            box(id+' • haste', lx+lw/2-1.5, y+20, 3, h-26, top, top+3, metal, .4)
            if id == 'manetes_potencia':
                box(id+' • punho', lx-3, y+4, lw+6, 28, top+3, top+14, lever[id], 6)
            else:
                box(id+' • punho', lx, y+22, lw, 16, top+3, top+13, lever[id], 3)
    elif id == 'ar_alternativo':
        for px in [x+26, x+w-26]:
            box(id+' • haste', px-3, y, 6, 18, top, top+3, metal, .5)
            box(id+' • puxador', px-13, y+16, 26, 22, top+3, top+12, silver, 6)
    elif id == 'cowl_flaps':
        for px in [x+26, x+w-26]:
            box(id+' • haste', px-2, y+30, 4, 18, top, top+4, metal, .5)
            sphere(id+' • bola', px, y+22, 17, top+17, black)
    elif id == 'seletor_trem':
        cylinder(id+' • roda', cx, y+h-40, 10, top, top+10, silver)
    elif id == 'extensao_emergencia_trem':
        o = cylinder(id+' • puxador', cx, y+h*.48, w/2-7, top, top+7, maroon)
        o.scale.y = (h*.27)/(w/2-7)
    elif id == 'chaves_magnetos_partida':
        for i in range(2):
            kx = x+w*(.28+i*.44); ky = y+h*.42
            cylinder(id+' • chave rotativa', kx, ky, 11, top, top+6, black)
            box(id+' • ponteiro', kx-1, ky-9, 2, 9, top+6, top+7, silver, .2)
    elif id in ['chave_master', 'chaves_alternadores', 'bombas_combustivel_eletricas', 'pitot_heat_luzes']:
        n = {'chave_master': 1, 'pitot_heat_luzes': 3}.get(id, 2)
        bw = min(18, (w-12)/n-4)
        for i in range(n):
            kx = x+6+i*((w-12)/n)+((w-12)/n-bw)/2
            box(id+' • tecla basculante', kx, y+6, bw, h-22, top, top+5, white, 2)
    elif id == 'disjuntores':
        cols = 16; dx = (w-20)/cols
        for row in range(2):
            for i in range(cols):
                if row == 0 and 6 <= i <= 8: continue
                kx = x+10+dx/2+i*dx; ky = y+18+row*38
                ring(id+' • flange', kx, ky, 7.5, top+.8, 1.2, metal)
                cylinder(id+' • botão', kx, ky, 5.5, top, top+5, white)
    elif id == 'piloto_automatico':
        cylinder(id+' • seletor', cx, y+h*.42, 13, top, top+6, white)
    elif id == 'freio_estacionamento':
        box(id+' • punho em T', x+6, y+4, w-12, 12, top, top+8, black, 3)
    elif id == 'estatica_alternada':
        box(id+' • puxador', x+14, y+h*.55, 6, h*.3, top, top+6, silver, 1.5)
    elif id == 'aquecimento_desembacador':
        for i in range(2):
            cylinder(id+' • puxador', x+46+i*30, y+16+i*24, 5, top, top+5, brown)
    elif id == 'navcom_1':
        # GNS 530W: tela com vidro próprio e dois botões duplos nos cantos.
        decal(id+' • vidro da tela', rect_pts(x+26, y+8, w-52, h-34), top+1.2, glass)
        for kx in [x+13, x+w-13]:
            cylinder(id+' • botão duplo externo', kx, y+h-13, 9, top, top+3, black)
            cylinder(id+' • botão duplo interno', kx, y+h-13, 4.5, top+3, top+6, black)
    elif id == 'navcom_2':
        for i, f in enumerate([.12, .42, .62, .9]):
            knob(id, x+w*f, y+h*.78, 4 if i % 3 == 0 else 6, top)
    elif id == 'transponder':
        decal(id+' • vidro do display', rect_pts(x+8, y+6, w-50, h*.42), top+.8, glass)
        cylinder(id+' • botão externo', x+w-20, y+h*.4, 10, top, top+3, black)
        cylinder(id+' • botão interno', x+w-20, y+h*.4, 5, top+3, top+6, black)
    elif id == 'adf_receptor':
        knob(id, x+22, y+h/2, 13, top)
    elif id == 'painel_audio':
        knob(id, x+w-12, y+h/2, 7, top)
    elif id == 'giro_direcional':
        rr = min(w, h)/2-9
        decal(id+' • vidro', circle_pts(cx, y+h/2, rr+3), top+1.2, glass)
        for kx in [x+10, x+w-10]: knob(id, kx, y+h-10, 5, top)
    elif id == 'relogio_copiloto_acendedor':
        cylinder(id+' • tomada 12V', cx, y+14, 10, top, top+4, black)
        ring(id+' • aro da tomada', cx, y+14, 10, top+4, 1.2, chrome)

# Câmera ortográfica: 1 unidade canônica = .01 unidade Blender.
bpy.ops.object.camera_add(location=(W*S/2, -H*S/2, 30))
camera = bpy.context.object
camera.name = 'Câmera frontal calibrada • não mover'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = W*S
camera.data.clip_end = 100
scene.camera = camera

def area(name, pos, energy, color, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.color = color
    data.shape = 'DISK'
    data.size = size
    o = bpy.data.objects.new(name, data)
    scene.collection.objects.link(o)
    o.location = pos
    o.rotation_euler = (Vector((W*S/2, -H*S/2, 0))-o.location).to_track_quat('-Z', 'Y').to_euler()
    return o
key = area('Janela superior esquerda', (1, 3, 10), 2300, (1, .93, .82), 7)
fill = area('Preenchimento direito', (17, -4, 8), 1200, (.7, .8, 1), 9)
rim = area('Luz rasante', (8, -1, 2.5), 380, (1, .8, .52), 5)

# Mede vértices avaliados dos corpos reais, incluindo modificadores e matrix_world.
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
def bounds_of(obj):
    ev = obj.evaluated_get(depsgraph)
    mesh = ev.to_mesh()
    pts = [world_to_camera_view(scene, camera, ev.matrix_world @ v.co) for v in mesh.vertices]
    ev.to_mesh_clear()
    return [min(p.x*W for p in pts), min((1-p.y)*H for p in pts), max(p.x*W for p in pts), max((1-p.y)*H for p in pts)]

projection = []
for e in MAP['instruments']:
    s = e['shape']
    bounds = bounds_of(bodies[e['id']])
    expected = [s['cx']-s['r'], s['cy']-s['r'], s['cx']+s['r'], s['cy']+s['r']] if s['kind'] == 'circle' else [s['x'], s['y'], s['x']+s['w'], s['y']+s['h']]
    center = [(expected[0]+expected[2])/2, (expected[1]+expected[3])/2]
    actual = [(bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2]
    error = math.dist(center, actual); bounds_error = max(abs(a-b) for a, b in zip(bounds, expected))
    assert error < .001 and bounds_error < .001, (e['id'], error, bounds_error)
    projection.append({'id': e['id'], 'object': bodies[e['id']].name, 'center': center, 'projected': actual, 'error': error, 'bounds': bounds, 'expectedBounds': expected, 'boundsError': bounds_error})
assert len(bodies) == N == len(set(bodies)), (len(bodies), N)
(HERE/'projection-check.json').write_text(json.dumps(projection, indent=2)+'\n')

# Raios frontais no centro de cada hotspot: o primeiro objeto atingido pertence ao
# próprio ID (nada do painel o encobre: acolchoado, placas, vizinhos).
rays = []
for e in MAP['instruments']:
    s = e['shape']
    x, y = (s['cx'], s['cy']) if s['kind'] == 'circle' else (s['x']+s['w']/2, s['y']+s['h']/2)
    hit, loc, normal, index, obj, matrix = scene.ray_cast(depsgraph, Vector((x*S, -y*S, 29)), Vector((0, 0, -1)))
    assert hit and obj.name.startswith(e['id']+' • '), (e['id'], obj.name if obj else None)
    rays.append({'id': e['id'], 'point': [x, y], 'firstHit': obj.name, 'depth': loc.z/S})

# ---- Manches em W com logo Piper: objetos separados (camada opcional) ----
target[0] = collection_yokes
yoke_checks = []
for i, yk in enumerate(GEO['yokes']):
    tag = f'Manche {"piloto" if i == 0 else "copiloto"}'
    c = yk['column']; box(tag+' • coluna', c['x'], c['y'], c['w'], c['h'], 30, 36, chrome, 3)
    for k, arm in enumerate(yk['arms']):
        prism(tag+f' • braço {"esquerdo" if k == 0 else "direito"}', arm, 32, 42, yoke_black, 3)
    for k, grip in enumerate(yk['grips']):
        prism(tag+' • punho', grip, 42, 47, chrome, 2)
    hb = yk['hubBox']
    hub = prism(tag+' • cubo', rrect(hb['x'], hb['y'], hb['w'], hb['h'], hb['rx']), 40, 52, yoke_hub, 3)
    for rg in yk['rings']:
        tube(tag+' • friso', rrect(rg['x'], rg['y'], rg['w'], rg['h'], rg['rx']), .8, 52.4, ring_silver, cyclic=True)
    lg = yk['logo']; prism(tag+' • logo Piper', rrect(lg['x'], lg['y'], lg['w'], lg['h'], lg['rx']), 52, 53, piper_blue, .3)
    prism(tag+' • estrela', yk['star'], 53, 53.8, piper_white, .1)
    br = yk['bar']; prism(tag+' • barra', rrect(br['x'], br['y'], br['w'], br['h'], br['rx']), 53.8, 54.6, piper_red, .1)
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    b = bounds_of(hub)
    expected = [hb['x'], hb['y'], hb['x']+hb['w'], hb['y']+hb['h']]
    err = max(abs(p-q) for p, q in zip(b, expected))
    assert err < .001, (tag, err)
    yoke_checks.append({'yoke': tag, 'hubBounds': b, 'expected': expected, 'boundsError': err})
target[0] = collection_panel
(HERE/'occlusion-check.json').write_text(json.dumps({'rays': rays, 'yokes': yoke_checks}, indent=2)+'\n')

def set_layer(name):
    # 'painel' renderiza só a coleção Painel; 'manches' só a camada dos manches.
    collection_panel.hide_render = name != 'painel'
    collection_yokes.hide_render = name != 'manches'

masters = []
for light in ['dia', 'noite']:
    night = light == 'noite'
    for o in faces: o.data.materials[0] = textures[light]
    key.data.energy = 2300 if not night else 170
    fill.data.energy = 1200 if not night else 130
    rim.data.energy = 380 if not night else 520
    rim.data.color = (1, .8, .52) if not night else (1, .26, .05)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35 if not night else .055
    if not night:
        set_layer('painel')
        bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'painel-seneca-i.blend'))
    for layer, prefix in [('painel', 'painel'), ('manches', 'manches')]:
        set_layer(layer)
        scene.render.filepath = str(HERE / f'masters/{prefix}-{light}.png')
        bpy.ops.render.render(write_still=True)
        masters.append(f'masters/{prefix}-{light}.png')
set_layer('painel')
verify_inputs()
provenance['masters'] = {f: fingerprint(f) for f in masters}
(HERE/'masters/render-provenance.json').write_text(json.dumps(provenance, indent=2)+'\n')
print(f'Painel independente renderizado; {N} corpos medidos, {len(rays)} raios sem oclusão, 2 manches; nenhuma fonte do avião aberta.')
