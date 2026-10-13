"""Painel didático independente. Nunca abre/importa/salva o avião.
Blender --background --python-exit-code 1 --python .../build_panel.py
"""
import bpy
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
W, H = MAP['width'], MAP['height']
S = 0.01
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = W * 2
scene.render.resolution_y = H * 2
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('Ambiente exclusivo do painel')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.22, .25, .30, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35

def mat(name, color, metal=0, rough=.4, grain=False):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes
    p = n.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if grain:
        noise = n.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 320
        bump = n.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .24
        bump.inputs['Distance'].default_value = .003
        m.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        m.node_tree.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m

plate = mat('Chapa grafite pintada • microtextura', (.055, .06, .055), .45, .42, True)
tan = mat('Acabamento bege acetinado', (.40, .30, .18), .12, .44, True)
metal = mat('Alumínio escovado', (.26, .28, .29), .85, .28)
black = mat('Borracha e baquelite', (.009, .012, .011), .05, .3, True)
bezel = mat('Aros pretos anodizados', (.03, .035, .032), .7, .24)

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
mix.inputs[0].default_value = .055
glass.node_tree.links.new(transparent.outputs[0], mix.inputs[1])
glass.node_tree.links.new(glossy.outputs[0], mix.inputs[2])
glass.node_tree.links.new(mix.outputs[0], out.inputs[0])

def finish(o, name, material, smooth=False):
    o.name = name
    o.data.materials.append(material)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    return o

def cube(name, x, y, w, h, z, depth, material, bevel_width=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x*S, -y*S, z*S))
    o = bpy.context.object
    o.dimensions = (w*S, h*S, depth*S)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width:
        b = o.modifiers.new('Bordas usinadas', 'BEVEL')
        b.width = bevel_width*S
        b.segments = 3
        o.modifiers.new('Normais de chapa', 'WEIGHTED_NORMAL')
    return finish(o, name, material)

def cylinder(name, x, y, r, z, depth, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=r*S, depth=depth*S, location=(x*S, -y*S, z*S))
    o = bpy.context.object
    b = o.modifiers.new('Borda arredondada', 'BEVEL')
    b.width = min(1.2, depth/3)*S
    b.segments = 3
    o.modifiers.new('Normais', 'WEIGHTED_NORMAL')
    return finish(o, name, material)

def ring(name, x, y, r, z, tube, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=(r-tube)*S, minor_radius=tube*S, major_segments=72, minor_segments=12, location=(x*S, -y*S, z*S))
    return finish(bpy.context.object, name, material, True)

def polygon(name, points, z, depth, material):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x*S, -y*S, z*S) for x,y in points], [], [list(reversed(range(len(points))))])
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(o)
    mod = o.modifiers.new('Espessura real', 'SOLIDIFY')
    mod.thickness = depth*S
    mod = o.modifiers.new('Acabamento de borda', 'BEVEL')
    mod.width = 3*S
    mod.segments = 3
    o.modifiers.new('Normais', 'WEIGHTED_NORMAL')
    return finish(o, name, material)

def tube(name, points, radius, material):
    c = bpy.data.curves.new(name, 'CURVE')
    c.dimensions = '3D'
    c.bevel_depth = radius*S
    c.bevel_resolution = 4
    line = c.splines.new('POLY')
    line.points.add(len(points)-1)
    for p, (x,y,z) in zip(line.points, points):
        p.co = (x*S, -y*S, z*S, 1)
    o = bpy.data.objects.new(name, c)
    scene.collection.objects.link(o)
    o.data.materials.append(material)
    return o

def screw(x, y, z=4, r=3):
    cylinder('Fixador de fenda', x, y, r, z, 1.5, metal)
    cube('Fenda do fixador', x, y, r*1.35, .6, z+1, .25, black, .1)

# Contorno próprio construído em volume, com arco acolchoado.
upper = [(52,188),(86,126),(200,74),(430,34),(800,21),(1170,34),(1400,74),(1514,126),(1548,188)]
# Suaviza o perfil por curva quadrática de Bézier correspondente ao desenho.
def bez(a,b,c,count=18):
    return [((1-t)**2*a[0]+2*(1-t)*t*b[0]+t*t*c[0], (1-t)**2*a[1]+2*(1-t)*t*b[1]+t*t*c[1]) for t in [i/count for i in range(count)]]
upper = (bez((52,188),(52,150),(86,126)) + bez((86,126),(200,50),(430,34)) + bez((430,34),(800,8),(1170,34)) + bez((1170,34),(1400,50),(1514,126)) + bez((1514,126),(1548,150),(1548,188)) + [(1548,188)])
polygon('Chapa frontal curva', upper + [(1548,638),(52,638)], 0, 14, plate)
tube('Borda acolchoada do glareshield', [(x,y,4) for x,y in upper], 10, black)
polygon('Faixa inferior bege', [(52,616),(1548,616),(1548,696),(52,696)], 2, 16, tan)
for x,y,w,h in [(376,375,400,290),(751,532,342,198)]:
    cube('Subchapa rebitada', x,y,w,h,1,3,plate,9)
    for sx in [-1,1]:
        for sy in [-1,1]: screw(x+sx*(w/2-8),y+sy*(h/2-8),3)

# Atlas só fornece impressão/agulhas; cada instrumento tem corpo próprio.
textures = {}
for light in ['dia','noite']:
    image = bpy.data.images.load(str(HERE / f'masters/serigrafia-{light}.png'))
    image.pack()
    m = mat('Serigrafia ' + light, (.06,.06,.06), 0, .6)
    p = m.node_tree.nodes.get('Principled BSDF')
    tex = m.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    m.node_tree.links.new(tex.outputs['Color'], p.inputs['Base Color'])
    m.node_tree.links.new(tex.outputs['Color'], p.inputs['Emission Color'])
    p.inputs['Emission Strength'].default_value = .28 if light == 'dia' else .85
    textures[light] = m

faces = []
def decal(name, points, z):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x*S,-y*S,z*S) for x,y in points], [], [list(reversed(range(len(points))))])
    mesh.update()
    uv = mesh.uv_layers.new(name='Coordenadas canônicas 1600x955')
    for loop in mesh.loops:
        x,y = points[loop.vertex_index]
        uv.data[loop.index].uv = (x/W, 1-y/H)
    o = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(o)
    finish(o,name,textures['dia'])
    faces.append(o)
    return o

def gauge(id, x,y,r,z=5):
    body = cylinder(id+' • corpo',x,y,r,z,6,bezel)
    ring(id+' • aro usinado',x,y,r,z+5,2.1,metal)
    ring(id+' • vedação',x,y,r-3,z+4,1.5,black)
    radius = r-4.5
    pts = [(x+radius*math.cos(a*math.tau/96),y+radius*math.sin(a*math.tau/96)) for a in range(96)]
    decal(id+' • mostrador impresso',pts,z+3.2)
    o = decal(id+' • vidro',pts,z+5)
    faces.remove(o)
    o.data.materials[0] = glass
    # Parafusos internos à área; nunca invadem um vizinho.
    for a in [45,135,225,315]:
        angle = math.radians(a)
        screw(x+(r-1)*math.cos(angle),y+(r-1)*math.sin(angle),z+7,1.5)
    return body

def g5(id, x, y, r, z=5):
    # Bisel plano preto (plástico), sem aro cromado/vedação mecânica — os dois
    # instrumentos que usam isto (horizonte_artificial, giro_direcional) são
    # telas eletrônicas Garmin G5 reais, não giros a vácuo/elétricos clássicos.
    body = cylinder(id+' • bisel G5',x,y,r,z,5,black)
    radius = r-3.5
    pts = [(x+radius*math.cos(a*math.tau/96),y+radius*math.sin(a*math.tau/96)) for a in range(96)]
    decal(id+' • tela impressa',pts,z+2.6)
    o = decal(id+' • vidro',pts,z+4.2)
    faces.remove(o)
    o.data.materials[0] = glass
    return body

def screen(id, x, y, w, h, z=5):
    # Moldura + vidro para a tela única de MFD/GPS (Garmin GNS 530W), em vez
    # de quatro caixas de rádio empilhadas. Corpo próprio, vidro refletivo sutil.
    body = cube(id+' • moldura',x+w/2,y+h/2,w,h,z,9,bezel,2)
    inset = 4
    ix,iy,iw,ih = x+inset,y+inset,w-inset*2,h-inset*2
    pts = [(ix,iy),(ix+iw,iy),(ix+iw,iy+ih),(ix,iy+ih)]
    decal(id+' • tela impressa',pts,z+4.6)
    o = decal(id+' • vidro',pts,z+6)
    faces.remove(o)
    o.data.materials[0] = glass
    for sx in [x+5,x+w-5]:
        for sy in [y+5,y+h-5]: screw(sx,sy,z+8,1.6)
    return body

def lamp_housing(id, x, y, r, z=5):
    # Luz redonda pequena embutida (aviso de estol) — não um instrumento;
    # sem aro cromado, sem vidro de precisão, só um bisel plástico fino.
    body = cylinder(id+' • bisel',x,y,r,z,4,black)
    radius = r-2.5
    pts = [(x+radius*math.cos(a*math.tau/48),y+radius*math.sin(a*math.tau/48)) for a in range(48)]
    decal(id+' • lente impressa',pts,z+2.2)
    return body

bodies = {}
for e in MAP['instruments']:
    s = e['shape']; id = e['id']
    if s['kind'] == 'circle':
        if id in ['horizonte_artificial','giro_direcional']:
            # Dois Garmin G5 reais (não giros mecânicos); bisel plano preto.
            bodies[id] = g5(id,s['cx'],s['cy'],s['r'],5)
            continue
        if id == 'aviso_estol':
            bodies[id] = lamp_housing(id,s['cx'],s['cy'],s['r'],5)
            continue
        # OAT montado à frente da borda (topo acolchoado z=14), sem mover XY.
        bodies[id] = gauge(id,s['cx'],s['cy'],s['r'],20 if id == 'termometro_oat' else 5)
        continue
    x,y,w,h = s['x'],s['y'],s['w'],s['h']
    if id == 'navcom_1':
        # Tela única de MFD/GPS (Garmin GNS 530W) — bisel/vidro próprios,
        # proporção real ~2,4:1, no seu próprio retângulo (não mais uma
        # união com navcom_2/adf_receptor/dme).
        bodies[id] = screen(id,x,y,w,h,5)
        continue
    bodies[id] = cube(id+' • caixa',x+w/2,y+h/2,w,h,5,10,bezel,3)
    decal(id+' • impressão',[(x+2,y+2),(x+w-2,y+2),(x+w-2,y+h-2),(x+2,y+h-2)],10.1)
    for sx in [x+4,x+w-4]:
        for sy in [y+4,y+h-4]: screw(sx,sy,11,1.7)
    if id in ['chave_master','chaves_alternadores','bombas_combustivel_eletricas','pitot_heat_luzes']:
        count = 1 if id == 'chave_master' else 3 if id == 'pitot_heat_luzes' else 2
        gap = (w-24-count*16)/max(1,count-1)
        for i in range(count):
            kx,kh = x+20+i*(16+gap), min(26,h-38)
            cube(id+' • interruptor',kx,y+10+kh/2,16,kh,14,7,black,2)
            cube(id+' • tecla',kx,y+14,12,7,18,3,metal,1)
    elif id == 'instrumentos_copiloto':
        # Mesmo porte dos instrumentos do piloto, como na aeronave real.
        rr = 54
        for kx in [x+4+rr, x+w/2, x+w-4-rr]:
            for ky in [y+4+rr, y+h-4-rr]: gauge(id,kx,ky,rr,5)
    elif id == 'relogio_copiloto_acendedor':
        gauge(id,x+40,y+h/2+2,24,13)
        cylinder(id+' • tomada',x+w-52,y+h/2+2,11,14,7,black)
        ring(id+' • aro tomada',x+w-52,y+h/2+2,12,17,1,metal)
    elif id == 'disjuntores':
        for i in range(12):
            kx,ky=x+22+(i%4)*40,y+26+(i//4)*24
            ring(id+' • flange',kx,ky,6,12,1,metal)
            cylinder(id+' • botão',kx,ky,4,15,7,black)
    elif id == 'chaves_magnetos_partida':
        for kx in [x+26,x+58]:
            cylinder(id+' • chave rotativa',kx,y+26,11,14,8,black)
            cube(id+' • ponteiro',kx-4,y+26,8,1.5,19,1,metal,.2)
    elif id == 'seletor_trem':
        tube(id+' • haste',[(x+w/2,y+h*.74,12),(x+w/2,y+h*.43,27)],3,metal)
        cube(id+' • punho',x+w/2,y+h*.43,30,19,27,17,black,7)

for x,y in [(624,126),(976,126),(624,618),(976,618),(72,620),(1528,620)]: screw(x,y,4)

# Câmera ortográfica: 1 unidade canônica = .01 unidade Blender.
bpy.ops.object.camera_add(location=(W*S/2,-H*S/2,30))
camera = bpy.context.object
camera.name = 'Câmera frontal calibrada • não mover'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = W*S
scene.camera = camera

def area(name, pos, energy, color, size):
    data = bpy.data.lights.new(name,'AREA')
    data.energy = energy
    data.color = color
    data.shape = 'DISK'
    data.size = size
    o = bpy.data.objects.new(name,data)
    scene.collection.objects.link(o)
    o.location = pos
    o.rotation_euler = (Vector((8,-4.5,0))-o.location).to_track_quat('-Z','Y').to_euler()
    return o
key = area('Janela superior esquerda',(1,3,10),2100,(1,.92,.79),7)
fill = area('Preenchimento direito',(17,-3,8),1100,(.66,.78,1),9)
rim = area('Luz rasante',(8,0,2.5),350,(1,.77,.47),5)

# Mede vértices avaliados dos corpos reais, incluindo modificadores e matrix_world.
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
projection = []
for e in MAP['instruments']:
    s=e['shape']; body=bodies[e['id']].evaluated_get(depsgraph)
    mesh=body.to_mesh()
    points=[world_to_camera_view(scene,camera,body.matrix_world @ v.co) for v in mesh.vertices]
    body.to_mesh_clear()
    bounds=[min(p.x*W for p in points),min((1-p.y)*H for p in points),max(p.x*W for p in points),max((1-p.y)*H for p in points)]
    expected=[s['cx']-s['r'],s['cy']-s['r'],s['cx']+s['r'],s['cy']+s['r']] if s['kind']=='circle' else [s['x'],s['y'],s['x']+s['w'],s['y']+s['h']]
    center=[(expected[0]+expected[2])/2,(expected[1]+expected[3])/2]
    actual=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2]
    error=math.dist(center,actual); bounds_error=max(abs(a-b) for a,b in zip(bounds,expected))
    assert error < .001 and bounds_error < .001, (e['id'],error,bounds_error)
    projection.append({'id':e['id'],'object':body.name,'center':center,'projected':actual,'error':error,'bounds':bounds,'expectedBounds':expected,'boundsError':bounds_error})
assert len(bodies)==49
(HERE/'projection-check.json').write_text(json.dumps(projection,indent=2)+'\n')
# Raios reais comprovam que a porção superior do OAT não está atrás da borda.
oat_checks=[]
for x,y in [(110,116),(103,118),(117,118),(110,130)]:
    hit,loc,normal,index,obj,matrix=scene.ray_cast(depsgraph,Vector((x*S,-y*S,30)),Vector((0,0,-1)))
    assert hit and obj.name.startswith('termometro_oat'), (x,y,obj.name if obj else None)
    oat_checks.append({'point':[x,y],'firstHit':obj.name,'depth':loc.z/S})
(HERE/'oat-clearance.json').write_text(json.dumps(oat_checks,indent=2)+'\n')
for light in ['dia','noite']:
    night = light == 'noite'
    for o in faces: o.data.materials[0]=textures[light]
    key.data.energy = 2100 if not night else 160
    fill.data.energy = 1100 if not night else 120
    rim.data.energy = 350 if not night else 500
    rim.data.color = (1,.77,.47) if not night else (1,.24,.045)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35 if not night else .055
    scene.render.filepath = str(HERE / f'masters/painel-{light}.png')
    if not night:
        bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'painel-seneca-i.blend'))
    bpy.ops.render.render(write_still=True)
verify_inputs()
provenance['masters']={f'masters/painel-{light}.png':fingerprint(f'masters/painel-{light}.png') for light in ['dia','noite']}
(HERE/'masters/render-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print('Painel independente renderizado; 49 corpos medidos; nenhuma fonte do avião aberta.')
