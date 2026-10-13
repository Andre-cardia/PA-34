"""Geração didática PA-34. Executar com Blender --background --python este_arquivo -- --source original.blend.
As posições internas são composição ilustrativa, NÃO cotas/instalações certificadas.
"""
import argparse, hashlib, json, math, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--source', required=True)
p.add_argument('--render', action='store_true')
p.add_argument('--render-layer', action='append', help='Renderizar somente esta coleção (ou montado); pode repetir')
args = p.parse_args(sys.argv[sys.argv.index('--')+1:])
source = Path(args.source).resolve()
output = ROOT / 'blender/pa34-camadas.blend'
assert source != output.resolve(), 'Nunca sobrescrever a fonte'
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
catalog = json.loads((ROOT/'src/data/componentes_3d.json').read_text())
ids = {c['id']:l['id'] for l in catalog['camadas'] for c in l['componentes']}
original = list(bpy.data.collections['PA-34 • Seneca bipá • revisão 08'].objects)
for o in list(bpy.data.objects):
    if o not in original: bpy.data.objects.remove(o, do_unlink=True)
cols = {}
for l in catalog['camadas']:
    col = bpy.data.collections.new(l['id']); bpy.context.scene.collection.children.link(col); cols[l['id']] = col

def tag(o, comp):
    assert comp in ids, comp
    for c in list(o.users_collection): c.objects.unlink(o)
    cols[ids[comp]].objects.link(o)
    o['componentId'] = comp; o['layerId'] = ids[comp]
    return o

def material(name, color, metal=0, rough=.45, alpha=1):
    m = bpy.data.materials.new(name); m.use_nodes = True
    n = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    n.inputs['Base Color'].default_value = (*color, alpha)
    n.inputs['Metallic'].default_value = metal; n.inputs['Roughness'].default_value = rough
    n.inputs['Alpha'].default_value = alpha
    m.diffuse_color = (*color, alpha)
    if alpha < 1: m.surface_render_method = 'DITHERED'
    return m
alum = material('Alumínio acetinado', (.48,.56,.62), .78,.3)
steel = material('Aço usinado', (.22,.28,.32), .85,.25)
black = material('Borracha e isolamento', (.025,.032,.04), 0,.8)
blue = material('Chicote elétrico azul', (.025,.19,.48), .05,.55)
copper = material('Tubulação combustível âmbar', (.55,.29,.065), .65,.35)
purple = material('Linhas pneumáticas violeta', (.3,.16,.43), .08,.55)
fabric = material('Estofamento azul petróleo', (.035,.09,.12), 0,.9)
white = material('Marcações de instrumentos', (.8,.83,.76), .1,.5)
green = material('Lentes de indicação', (.03,.65,.18), .15,.2)
glass = material('Vidros separados', (.085,.24,.32), .12,.15,.55)

# Converter curvas e modificadores avaliados; preservar a forma e materiais da fonte.
for o in original:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Cascas da fonte para contenção dos internos (ray casts no referencial único).
from mathutils.bvhtree import BVHTree
shells={}
for o in original:
    if o.name.startswith(('01 ','05 Asa','07 Carenagem')):
        shells[o.name]=BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[tuple(f.vertices) for f in o.data.polygons])

tailverts=[]; tailfaces=[]
for o in original:
    if o.name.startswith(('06 ','09 ')):
        start=len(tailverts); tailverts.extend(o.matrix_world@v.co for v in o.data.vertices)
        tailfaces.extend(tuple(start+i for i in f.vertices) for f in o.data.polygons)
tail=BVHTree.FromPolygons(tailverts,tailfaces)

def split_faces(o, classifier):
    buckets = {}
    for f in o.data.polygons: buckets.setdefault(classifier(f), []).append(f.index)
    result=[]
    for comp, faces in buckets.items():
        mesh=o.data.copy(); obj=bpy.data.objects.new(o.name+' • '+comp,mesh)
        bpy.context.scene.collection.objects.link(obj); obj.matrix_world=o.matrix_world.copy()
        bm=bmesh.new(); bm.from_mesh(mesh); bm.faces.ensure_lookup_table()
        keep=set(faces); bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index not in keep],context='FACES')
        bm.to_mesh(mesh); bm.free(); tag(obj,comp); result.append(obj)
    bpy.data.objects.remove(o,do_unlink=True)
    return result

# A textura original determina quais faces da pele são vidro; não sobrepor outra pele.
for o in original:
    n=o.name.lower()
    center=o.matrix_world @ (sum((Vector(v) for v in o.bound_box),Vector())/8)
    side='esq' if center.y<0 else 'dir'
    if n.startswith('01 '):
        mat=o.data.materials[0]
        image=next(l.from_node.image for l in mat.node_tree.links if l.to_socket.name=='Base Color')
        pix=list(image.pixels); w,h=image.size; uv=o.data.uv_layers.active.data
        def body(f):
            co=o.matrix_world@f.center
            u=sum(uv[i].uv.x for i in f.loop_indices)/len(f.loop_indices)
            v=sum(uv[i].uv.y for i in f.loop_indices)/len(f.loop_indices)
            idx=(min(h-1,max(0,int(v*h)))*w+min(w-1,max(0,int(u*w))))*4
            r,g,b=pix[idx:idx+3]
            if -2.3<co.x<1.9 and co.z>1.28 and b>r*1.15 and .015<b<.65:
                return 'para_brisa_janelas'
            if co.x < -3.9: return 'pontas_asa_nariz_fibra'
            return 'fuselagem_externa'
        for part in split_faces(o,body):
            if part['componentId']=='para_brisa_janelas':
                part.data.materials.clear(); part.data.materials.append(glass)
                for f in part.data.polygons: f.material_index=0
    elif n.startswith('05 asa'):
        # Cortes planos com tampas: não separar centroides de triângulos (bordos serrilhados).
        sign=-1 if center.y<0 else 1
        regions=[('asa_externa_esq_dir',[(0,-.39,False)]),
                 ('asa_externa_esq_dir',[(0,-.39,True),(1,sign*.7,sign<0)]),
                 ('flaps_superficies',[(0,-.39,True),(1,sign*.7,sign>0),(1,sign*3.2,sign<0)]),
                 ('ailerons',[(0,-.39,True),(1,sign*3.2,sign>0)])]
        for comp,cuts in regions:
            bm=bmesh.new(); bm.from_mesh(o.data); bmesh.ops.transform(bm,matrix=o.matrix_world,verts=list(bm.verts))
            for axis,value,positive in cuts:
                point=Vector((0,0,0));point[axis]=value;normal=Vector((0,0,0));normal[axis]=1
                cut=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=point,plane_no=normal,clear_inner=positive,clear_outer=not positive)
                edges=[g for g in cut['geom_cut'] if isinstance(g,bmesh.types.BMEdge) and g.is_boundary]
                if edges: bmesh.ops.holes_fill(bm,edges=edges,sides=0)
            bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
            mesh=bpy.data.meshes.new(comp);bm.to_mesh(mesh);bm.free()
            for m in o.data.materials: mesh.materials.append(m)
            part=bpy.data.objects.new(o.name+' • '+comp,mesh);bpy.context.scene.collection.objects.link(part);tag(part,comp)
        bpy.data.objects.remove(o,do_unlink=True)
    elif n.startswith('04 '): tag(o,'portas_bagageiros')
    elif 'aileron' in n: tag(o,'ailerons')
    elif 'flap' in n: tag(o,'flaps_superficies')
    elif n.startswith('05 ponta') or n.startswith('luz de navegação'): tag(o,'pontas_asa_nariz_fibra')
    elif n.startswith('05 '): tag(o,'asa_externa_esq_dir')
    elif n.startswith('06 '): tag(o,'stabilator_tab')
    elif 'leme' in n: tag(o,'leme_tab')
    elif n.startswith('09 '): tag(o,'empenagem_externa')
    elif n.startswith('07 escape'): tag(o,'escapamento_crossover')
    elif n.startswith('07 '): tag(o,'naceles_carenagens')
    elif n.startswith('08 '): tag(o,'helice_esquerda' if side=='esq' else 'helice_direita')
    elif n.startswith('10 porta'): tag(o,'portas_pocos')
    elif n.startswith('10 '): tag(o,'perna_dianteira' if abs(center.y)<.3 else 'pernas_principais')
    elif n.startswith('11 '): tag(o,'antenas')
    elif n.startswith('tampa de combustível'): tag(o,'tanque_auxiliar_'+side)
    else: raise ValueError('Objeto original não mapeado: '+o.name)

# Primitivas só no Blender: cada conjunto tem topologia/materiais específicos.
def finish(o,c,m):
    o.name=c; o.data.materials.append(m); tag(o,c); o['generated']=True
    return o

def box(c, loc, dim, m=alum, bevel=.01):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.dimensions=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Arestas de fabricação','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,c,m)

def rod(c,a,b,r=.018,m=steel,vertices=12):
    a,b=Vector(a),Vector(b); d=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(a+b)/2)
    o=bpy.context.object; o.rotation_mode='QUATERNION'; o.rotation_quaternion=d.to_track_quat('Z','Y')
    for f in o.data.polygons: f.use_smooth=len(f.vertices)==4
    return finish(o,c,m)

def safe_route_point(c,point,r):
    q=Vector(point)
    if c in {'escapamento_crossover','freios','tubo_pitot','bomba_hidraulica_trem','cabos_polias','aquecimento_ventilacao','gascolators_drenos'}: return q
    candidates=[]
    if 1.49<abs(q.y)<2.31 and -2.8<q.x<-.15:
        candidates += [t for n,t in shells.items() if n.startswith('07 Carenagem')]
    candidates += [t for n,t in shells.items() if n.startswith(('01 ',) if c=='semimonocoque_caixilhos' else ('05 Asa','01 '))]
    if c=='semimonocoque_caixilhos':
        origin=Vector((q.x,0,1.18));d=q-origin
        hit=candidates[0].ray_cast(origin,d.normalized())[0] if d.length else None
        if hit is not None and d.length>(hit-origin).length-r-.02:
            q=origin+d.normalized()*max(.01,(hit-origin).length-r-.02)
    for tree in candidates:
        top=tree.ray_cast(Vector((q.x,q.y,5)),Vector((0,0,-1)))[0]
        bottom=tree.ray_cast(Vector((q.x,q.y,-2)),Vector((0,0,1)))[0]
        if top is not None and bottom is not None and top.z-bottom.z>2*r+.015:
            q.z=max(bottom.z+r+.009,min(top.z-r-.009,q.z)); return q
    return q

def line(c,points,r=.012,m=steel):
    # Ajustar o eixo ANTES do sweep mantém seção circular e evita lâminas de vértices esmagados.
    original=[Vector(p) for p in points]; rounded=[original[0]]
    for i in range(1,len(original)-1):
        prev,corner,nxt=original[i-1:i+2]
        radius=min(.1,(prev-corner).length*.22,(nxt-corner).length*.22)
        entry=corner+(prev-corner).normalized()*radius; exit=corner+(nxt-corner).normalized()*radius
        rounded.append(entry)
        for k in range(1,6):
            t=k/5; rounded.append(entry*(1-t)**2+corner*(2*t*(1-t))+exit*t*t)
    rounded.append(original[-1]); route=[]
    for a,b in zip(rounded,rounded[1:]):
        steps=max(1,math.ceil((b-a).length/.055))
        for i in range(steps): route.append(safe_route_point(c,a.lerp(b,i/steps),r))
    route.append(safe_route_point(c,rounded[-1],r))
    curve=bpy.data.curves.new(c+' percurso','CURVE'); curve.dimensions='3D'
    curve.bevel_depth=r; curve.bevel_resolution=2; curve.resolution_u=1
    spline=curve.splines.new('POLY'); spline.points.add(len(route)-1)
    for bp,co in zip(spline.points,route): bp.co=(*co,1)
    o=bpy.data.objects.new(c,curve); bpy.context.scene.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    for f in o.data.polygons: f.use_smooth=True
    finish(o,c,m); o['route']=True

def ring(c,center,r1,r2,axis='X',m=steel):
    bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=6,location=center,major_radius=r1,minor_radius=r2)
    o=bpy.context.object
    for f in o.data.polygons: f.use_smooth=True
    if axis=='X': o.rotation_euler.y=math.pi/2
    elif axis=='Y': o.rotation_euler.x=math.pi/2
    return finish(o,c,m)

def pump(c,loc,m=alum):
    before=set(bpy.data.objects)
    point=Vector(loc)
    if c=='reguladores_vacuo': point.x=-1.52;point.z=1.18
    if c=='valvula_retencao_filtros': point.y*=.7;point.z=1.3
    point=safe_route_point(c,point,.14)
    x,y,z=point
    rod(c,(x-.09,y,z),(x+.09,y,z),.07,m,20)
    for dx in [-.09,.09]: ring(c,(x+dx,y,z),.07,.012,'X',steel)
    rod(c,(x,y,z+.055),(x,y,z+.13),.021,copper)
    rod(c,(x,y-.055,z),(x,y-.13,z),.021,copper)
    box(c,(x,y,z-.075),(.23,.18,.025),steel)
    for o in set(bpy.data.objects)-before: o['rigid']=True

def dial(c,x,y,z,r=.07):
    rod(c,(x,y,z),(x+.08,y,z),r,black,24)
    ring(c,(x+.083,y,z),r,.008,'X',alum)
    for i in range(12):
        a=i*math.tau/12
        rod(c,(x+.089,y+math.cos(a)*r*.8,z+math.sin(a)*r*.8),(x+.089,y+math.cos(a)*r*.93,z+math.sin(a)*r*.93),.002,white,6)
    rod(c,(x+.092,y,z),(x+.092,y-r*.5,z+r*.4),.003,white,6)

# Estrutura: chapas perfuradas extrudadas, almas e mesas de perfis em I.
def plate_ring(c,center,rx,rz,thickness,band,axis='X'):
    # Quatro contornos: frente/trás, externo/interno. Abertura vazada, não tubo.
    verts=[]; segments=40
    for depth in [-thickness/2,thickness/2]:
        for inner in [False,True]:
            for i in range(segments):
                a=i*math.tau/segments; u=(rx-band if inner else rx)*math.cos(a); v=(rz-band if inner else rz)*math.sin(a)
                offset=Vector((depth,u,v) if axis=='X' else (u,v,depth) if axis=='Z' else (u,depth,v))
                verts.append(tuple(Vector(center)+offset))
    faces=[]
    for i in range(segments):
        j=(i+1)%segments
        faces.extend([(i,j,segments+j,segments+i),(2*segments+i,3*segments+i,3*segments+j,2*segments+j),
                      (i,2*segments+i,2*segments+j,j),(segments+i,segments+j,3*segments+j,3*segments+i)])
    mesh=bpy.data.meshes.new(c); mesh.from_pydata(verts,[],faces)
    o=bpy.data.objects.new(c,mesh); bpy.context.scene.collection.objects.link(o); finish(o,c,alum)
    return o
for c,x in [('longarina_principal',-1.0),('longarina_traseira',-.42)]:
    for s in [-1,1]:
        for zoff in [-.065,.065]:
            flange=box(c,(x,s*3.075,1.132+zoff),(.10,5.18,.015),alum,.002)
            flange.rotation_euler.x=s*math.atan(.108)
        web=box(c,(x,s*3.075,1.132),(.015,5.18,.13),alum,.001)
        web.rotation_euler.x=s*math.atan(.108)
        for y in [.65,1.1,1.5,2.35,2.8,3.4,4,4.6,5.2,5.6]:
            z=.8+y*.108
            box(c,(x+.014,s*y,z),(.025,.018,.13),steel,.002)
            if c=='longarina_principal':
                plate_ring(c,(-.87,s*y,z),.65,.082,.015,.025,'Y')
for x in [-1.15,-.45]:
    for z in [.75,.87]: rod('caixao_central_asa',(x,-.55,z),(x,.55,z),.035,alum)
for y in [-.5,.5]: box('caixao_central_asa',(-.8,y,.81),(.78,.035,.16),alum)
for x in [-2.5,-1.9,-1.25,-.55,.2,.95,1.6,2.2,2.8,3.3]:
    radius=.51 if x<1 else max(.12,.51-(x-1)*.15)
    plate_ring('semimonocoque_caixilhos',(x,0,1.18),radius,radius*1.25,.018,.045)
    plate_ring('semimonocoque_caixilhos',(x-.014,0,1.18),radius+.006,radius*1.25+.006,.015,.016)
    for a in [i*math.tau/12 for i in range(12)]:
        rod('semimonocoque_caixilhos',(x+.01,(radius-.022)*math.cos(a),1.18+(radius*1.25-.022)*math.sin(a)),(x+.021,(radius-.022)*math.cos(a),1.18+(radius*1.25-.022)*math.sin(a)),.005,steel,8)
for a in [0,math.pi/2,math.pi,math.pi*1.5]:
    line('semimonocoque_caixilhos',[(x,(.51 if x<1 else max(.12,.51-(x-1)*.15))*math.cos(a),1.18+(.51 if x<1 else max(.12,.51-(x-1)*.15))*1.25*math.sin(a)) for x in [-2.5,-1.9,-1.25,-.55,.2,.95,1.6,2.2,2.8,3.3]],.012,alum)
for s in [-1,1]:
    y=1.905*s
    for dy in [-.25,.25]:
        for dz in [-.2,.2]:
            rod('bercos_motor',(-1.35,y+dy,1.2+dz),(-2.05,y+dy*.6,1.2-dz*.4),.024,steel)
            ring('bercos_motor',(-2.05,y+dy*.6,1.2-dz*.4),.045,.014,'X',black)
    box('estrutura_empenagem',(3.8,s*1.0,1.13),(.025,1.95,.055),alum,.001)
    for yy in [.3,.6,.9,1.2,1.5,1.8]: plate_ring('estrutura_empenagem',(3.84,s*yy,1.13),.35,.035,.012,.012,'Y')
for z in [1.5,1.8,2.1,2.4,2.7]:
    plate_ring('estrutura_empenagem',(3.65,0,z),.35,.07,.018,.025,'Z')
box('estrutura_empenagem',(3.62,0,2.12),(.055,.035,1.6),alum,.003)
box('estrutura_empenagem',(4.02,0,2.12),(.035,.025,1.6),alum,.003)

# Motores opostos: cárter, quatro cilindros com aletas, tampas, tubos e acessórios.
for s in [-1,1]:
    y=1.905*s; c='motor_esquerdo' if s<0 else 'motor_direito'
    box(c,(-2.15,y,1.18),(.68,.23,.29),steel,.07)
    box(c,(-2.12,y,1.01),(.43,.22,.13),alum,.045)
    rod(c,(-2.85,y,1.22),(-2.4,y,1.22),.065,steel)
    for x in [-2.36,-1.99]:
        for d in [-1,1]:
            rod(c,(x,y+d*.1,1.22),(x,y+d*.35,1.22),.095,steel,20)
            for k in range(7):
                yy=y+d*(.14+k*.029)
                rod(c,(x,yy-.005,1.22),(x,yy+.005,1.22),.119,alum,20)
            box(c,(x,y+d*.365,1.22),(.22,.065,.2),alum,.025)
            for dx in [-.055,.055]: rod(c,(x+dx,y+d*.12,1.12),(x+dx,y+d*.32,1.13),.014,steel)
            line('sistema_injecao',[(-2.18,y,1.43),(x,y+d*.2,1.43),(x,y+d*.32,1.3)],.008,copper)
            line('escapamento_crossover',[(x,y+d*.27,1.12),(x,y+d*.29,.92),(-1.68,y+d*.2,.92)],.033,steel)
    pump('sistema_injecao',(-2.18,y,1.4),alum)
    rod('escapamento_crossover',(-1.75,y-.25,.93),(-1.75,y+.25,.93),.068,steel)
    box('admissao_ar_alternativo',(-2.56,y,.99),(.28,.23,.11),black,.02)
    for k in range(9): box('admissao_ar_alternativo',(-2.69,y-.1+k*.025,1),(.016,.006,.09),alum,.002)
    line('admissao_ar_alternativo',[(-2.58,y,.97),(-2.25,y,.94),(-2.15,y,1.08)],.045,black)
    for k in range(12): box('radiador_oleo',(-1.43+k*.009,y,1.34),(.004,.3,.2),alum,.001)
    for dy in [-.17,.17]: rod('radiador_oleo',(-1.39,y+dy,1.22),(-1.39,y+dy,1.46),.016,steel)
    for dy in [-.14,.14]: pump('governadores_magnetos',(-1.65,y+dy,1.23),black)
    pump('governadores_magnetos',(-2.6,y,1.39),steel)
    for dy in [-.19,.19]: box('cowl_flaps_comp',(-1.5,y+dy,.9),(.3,.26,.015),alum,.003)

# Combustível: tanques perfilados com costuras, reforços e conexões.
for s,side in [(-1,'esq'),(1,'dir')]:
    for typ,yc in [('principal',2.65),('auxiliar',4.2)]:
        c='tanque_'+typ+'_'+side; y=yc*s; z=.8+yc*.108
        # Seção lenticular extrudada, não um bloco arredondado.
        verts=[(x,y+dy,z+dz) for dy in [-.52,.52] for x,dz in [(-1.42,0),(-1.25,.07),(-.65,.06),(-.49,0),(-.7,-.055),(-1.2,-.05)]]
        faces=[tuple(range(5,-1,-1)),tuple(range(6,12))]+[(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
        mesh=bpy.data.meshes.new(c); mesh.from_pydata(verts,[],faces); ob=bpy.data.objects.new(c,mesh); bpy.context.scene.collection.objects.link(ob); finish(ob,c,alum)
        for dy in [-.5,0,.5]: line(c,[(-1.42,y+dy,z),(-1.25,y+dy,z+.075),(-.65,y+dy,z+.065),(-.49,y+dy,z)],.009,copper)
        rod('sensores_quantidade',(-.95,y,z-.035),(-.95,y,z+.12),.017,steel)
        line('sensores_quantidade',[(-.95,y,z+.02),(-.8,y+.12,z-.015)],.009,steel)
        rod('gascolators_drenos',(-1,y,z-.05),(-1,y,z-.14),.025,copper)
    pump('bombas_mecanicas',(-1.6,s*1.9,1.02))
    pump('bombas_eletricas',(-1.2,s*1.9,1.04),black)
    pump('gascolators_drenos',(-1.4,s*1.5,.8),copper)
    pump('seletoras_valvulas',(-.6,s*.14,.82),copper)
    rod('seletoras_valvulas',(-.6,s*.14,.88),(-.5,s*.14,1.02),.02,black)
    line('linhas_crossfeed',[(-1,4.2*s,1.22),(-1,2.65*s,1.04),(-1.1,1.5*s,.85),(-.6,s*.14,.8),(-1.2,s*1.9,1.04),(-1.6,s*1.9,1.02)],.015,copper)
line('linhas_crossfeed',[(-.6,-1.5,.8),(-.3,-.3,.7),(-.3,.3,.7),(-.6,1.5,.8)],.016,copper)

# Elétrica: terminais, chicotes, dissipadores e disjuntores.
box('bateria',(-2.9,0,1.02),(.35,.34,.25),black,.018)
box('bateria',(-2.9,0,1.155),(.37,.36,.025),blue,.005)
for s in [-1,1]:
    rod('bateria',(-2.9,.1*s,1.17),(-2.9,.1*s,1.22),.025,copper)
    line('bateria',[(-2.9,.1*s,1.22),(-2.65,.18*s,1.22),(-1.85,.4*s,1.1)],.016,blue if s<0 else black)
    pump('alternadores',(-2.47,1.905*s,1.03),alum)
    for k in range(7): ring('alternadores',(-2.52+k*.016,1.905*s,1.03),.076,.006,'X',steel)
    box('reguladores_ov',(-2.05,s*.25,1.24),(.12,.2,.15),alum)
    for k in range(6): box('reguladores_ov',(-1.98,s*.25,1.18+k*.021),(.055,.2,.006),steel,.001)
    pump('reles_partida_master',(-2.3,s*.2,1.02),black)
    line('alternadores',[(-2.47,s*1.905,1.03),(-1.4,s*1.8,1.15),(-1.4,s*.4,1.12),(-2.05,s*.25,1.24)],.012,blue)
box('barramento_disjuntores',(-1.65,.36,1.1),(.04,.35,.14),black)
for i in range(8):
    for j in range(2): rod('barramento_disjuntores',(-1.61,.2+i*.043,1.065+j*.065),(-1.58,.2+i*.043,1.065+j*.065),.012,white)
for y in [.23,.41]: dial('amperimetros_comp',-1.65,y,1.27,.055)
pump('motor_bomba_trem',(-2.55,0,.88),black)

# Pneumática: dois circuitos de bombas, filtros e linhas até o painel.
for s in [-1,1]:
    pump('bombas_vacuo',(-1.57,s*1.9,1.36),steel)
    pump('reguladores_vacuo',(-1.2,s*1.9,1.36),purple)
    pump('valvula_retencao_filtros',(-1.8,s*.35,1.5),white)
    line('bombas_vacuo',[(-1.57,s*1.9,1.28),(-1.52,s*1.9,1.18),(-1.35,s*1.4,.95),(-1.25,s*.6,.82),(-1.8,s*.245,1.3)],.012,purple)
    rod('tomadas_estaticas',(1.3,s*.45,1.15),(1.3,s*.49,1.15),.028,alum)
    line('tomadas_estaticas',[(1.3,s*.45,1.15),(1,s*.4,1.02),(-1.7,s*.4,1.08)],.01,purple)
line('tubo_pitot',[(-1.25,-3.1,1.12),(-1.25,-3.1,.85),(-1.6,-3.1,.85)],.022,steel)
line('tubo_pitot',[(-1.25,-3.1,1.12),(-1.2,-.4,1.02),(-1.7,-.4,1.35)],.01,purple)
pump('estatica_alternada_comp',(-1.55,.13,1.02),purple)
dial('indicador_succao_comp',-1.65,.12,1.27,.048)

# Trem: preservar as pernas existentes; adicionar freios, hidráulica e comando.
pump('bomba_hidraulica_trem',(-2.42,.16,.9),alum)
rod('bomba_hidraulica_trem',(-2.42,.16,.95),(-2.42,.16,1.17),.07,alum)
for s in [-1,1]:
    rod('freios',(-.77,1.58*s,.29),(-.77,1.61*s,.29),.13,steel,32)
    ring('freios',(-.77,1.6*s,.29),.115,.009,'Y',alum)
    box('freios',(-.68,1.6*s,.36),(.12,.09,.13),black)
    line('freios',[(-.68,1.6*s,.36),(-.9,1.6*s,.8),(-1.7,s*.4,.85)],.01,copper)
    line('bomba_hidraulica_trem',[(-2.42,.16,.9),(-1.4,s*.3,.8),(-.8,1.68*s,.8)],.012,steel)
box('squat_switch',(-.9,-1.73,.62),(.07,.06,.08),black)
rod('squat_switch',(-.88,-1.74,.62),(-.79,-1.74,.51),.012,alum)
rod('sistema_emergencia',(-1.65,0,1.12),(-1.48,0,1.12),.014,steel)
ring('sistema_emergencia',(-1.46,0,1.12),.04,.009,'X',copper)
box('indicacao_aviso_trem',(-1.63,.33,1.4),(.025,.23,.065),black)
for y in [.25,.33,.41]: rod('indicacao_aviso_trem',(-1.61,y,1.4),(-1.59,y,1.4),.018,green)

# Comandos: circuitos de cabos, polias, manches e rodas de trim.
for s in [-1,1]:
    line('cabos_polias',[(-1.3,s*.27,1.2),(-1,s*.27,.82),(.2,s*.15,.77),(3.65,s*.1,1.14)],.008,steel)
    line('cabos_polias',[(-1,s*.27,.82),(-.45,s*2,.99),(-.45,s*5.2,1.39)],.008,steel)
    for x in [-1,.2,2.6]: ring('cabos_polias',(x,s*.15,.81),.055,.012,'Y',alum)
    rod('cabos_polias',(-1.65,s*.27,1.28),(-1.23,s*.27,1.28),.024,steel)
    line('cabos_polias',[(-1.23,s*.43,1.35),(-1.23,s*.42,1.22),(-1.23,s*.12,1.22),(-1.23,s*.11,1.35)],.021,black)
ring('compensadores_comp',(-.65,0,1.04),.12,.018,'Y',black)
for a in [0,math.pi/2]: rod('compensadores_comp',(-.65-.1*math.cos(a),0,1.04-.1*math.sin(a)),(-.65+.1*math.cos(a),0,1.04+.1*math.sin(a)),.009,alum)

# Cabine: assentos estofados com costuras/cintos, instrumentos analógicos e rádios.
box('painel_instrumentos',(-1.73,0,1.37),(.09,1.04,.42),black,.035)
for y in [-.43,-.27,-.11]:
    for z in [1.35,1.52]: dial('seis_pack_piloto',-1.67,y,z,.065)
for z in [1.18,1.27,1.36,1.45,1.54]:
    box('radios_coluna',(-1.66,.085,z),(.055,.18,.075),steel,.005)
    box('radios_coluna',(-1.628,.06,z),(.005,.095,.025),green,.001)
    rod('radios_coluna',(-1.625,.145,z),(-1.61,.145,z),.015,black)
for x in [-.9,.05,.95]:
    for y in [-.28,.28]:
        box('assentos',(x,y,.95),(.52,.43,.13),fabric,.06)
        back=box('assentos',(x+.23,y,1.23),(.13,.43,.52),fabric,.055); back.rotation_euler.y=-.1
        box('assentos',(x+.25,y,1.53),(.14,.28,.15),fabric,.05)
        for dy in [-.15,.15]:
            rod('assentos',(x-.15,y+dy,.75),(x+.2,y+dy,.85),.018,alum)
            line('assentos',[(x-.21,y+dy,1.015),(x+.14,y+dy,1.015),(x+.16,y+dy,1.44)],.004,white)
        line('assentos',[(x-.1,y-.19,1.03),(x+.1,y,1.05),(x-.1,y+.19,1.03)],.021,black)
        box('assentos',(x+.1,y,1.055),(.05,.05,.02),alum,.003)
# Pequenas peças montadas em suportes contínuos, não anéis soltos.
# Composição didática: estes trilhos/dutos NÃO afirmam instalação real do Seneca.
# Medir folga do conjunto inteiro antes de criar; nunca esmagar cada vértice
# contra o teto (a costura central da fonte pode não interceptar um raio).
cabin_before=set(bpy.data.objects)
body_shell=next(tree for name,tree in shells.items() if name.startswith('01 '))
def cabin_ceiling(x,y,r=.07):
    heights=[]
    for dx in [-r,0,r]:
        for dy in [-r,-.025,.025,r]:
            hit=body_shell.ray_cast(Vector((x+dx,y+dy,5)),Vector((0,0,-1)))[0]
            if hit is not None: heights.append(hit.z)
    assert heights, 'Teto da cabine não encontrado'
    return min(heights)-.065
stations=[-1.12,-.9,-.45,.05,.5,.95,1.1]
# Calha central estreita com três luminárias circulares: flange, corpo e difusor.
light_path=[Vector((x,0,cabin_ceiling(x,0))) for x in stations]
for a,b in zip(light_path,light_path[1:]):
    rod('iluminacao_interna',a,b,.023,alum,12)
for x in [-.9,.05,.95]:
    z=cabin_ceiling(x,0)
    rod('iluminacao_interna',(x,0,z),(x,0,z-.026),.062,alum,32)
    rod('iluminacao_interna',(x,0,z-.027),(x,0,z-.039),.048,white,32)
    ring('iluminacao_interna',(x,0,z-.031),.054,.007,'Z',steel)
    for dx in [-.041,.041]:
        rod('iluminacao_interna',(x+dx,0,z-.031),(x+dx,0,z-.035),.003,steel,8)
# Dutos laterais com bocais ligados e grelhas de orientação; seções rígidas.
for s in [-1,1]:
    y=s*.32
    path=[Vector((x,y,cabin_ceiling(x,y))) for x in stations]
    for a,b in zip(path,path[1:]): rod('aquecimento_ventilacao',a,b,.022,black,16)
    for x in [-.9,.05,.95]:
        z=cabin_ceiling(x,y)
        rod('aquecimento_ventilacao',(x,y,z),(x,y,z-.035),.052,alum,24)
        rod('aquecimento_ventilacao',(x,y,z-.035),(x,y,z-.041),.043,black,24)
        ring('aquecimento_ventilacao',(x,y,z-.042),.046,.006,'Z',steel)
        for dx in [-.022,0,.022]:
            rod('aquecimento_ventilacao',(x+dx,y-.029,z-.047),(x+dx,y+.029,z-.047),.004,alum,8)
# As peças já cabem como conjuntos; preservar círculos, difusores e grelhas.
for o in set(bpy.data.objects)-cabin_before: o['rigid']=True

# Amostrar as longarinas ao longo da envergadura ANTES de ajustar à pele.
# Uma mesa com cinco metros e só vértices nas pontas atravessava o perfil
# intermediário: conter as extremidades não contém a face que as conecta.
# Cortes em Y preservam as seções/aberturas e não subdividem outras camadas.
bpy.context.view_layer.update()
for o in cols['estrutura'].objects:
    if o.get('componentId') not in {'longarina_principal','longarina_traseira'}: continue
    bm=bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.transform(bm,matrix=o.matrix_world,verts=list(bm.verts))
    lo=min(v.co.y for v in bm.verts); hi=max(v.co.y for v in bm.verts)
    for station in range(math.floor(lo/.04)+1,math.ceil(hi/.04)):
        bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
                              dist=.000001,plane_co=(0,station*.04,0),plane_no=(0,1,0))
    bmesh.ops.transform(bm,matrix=o.matrix_world.inverted(),verts=list(bm.verts))
    bm.to_mesh(o.data); bm.free()

# Conter os internos na casca medida da fonte. Não altera a geometria externa.
bpy.context.view_layer.update()
wing_components={'longarina_principal','longarina_traseira','tanque_principal_esq','tanque_principal_dir','tanque_auxiliar_esq','tanque_auxiliar_dir','sensores_quantidade','linhas_crossfeed'}
body_components={'semimonocoque_caixilhos','caixao_central_asa','bateria','painel_instrumentos','assentos','iluminacao_interna','aquecimento_ventilacao'}
for col in cols.values():
    for o in col.objects:
        if not o.get('generated') or o.get('route') or o.get('rigid'): continue
        c=o['componentId']; inv=o.matrix_world.inverted()
        for v in o.data.vertices:
            q=o.matrix_world@v.co
            if c=='estrutura_empenagem':
                if q.z>1.25:
                    # Perfil vertical medido no plano central da deriva.
                    front=tail.ray_cast(Vector((-10,.001,q.z)),Vector((1,0,0)))[0]
                    rear=tail.ray_cast(Vector((10,.001,q.z)),Vector((-1,0,0)))[0]
                    if front is not None and rear is not None:
                        q.x=max(front.x+.018,min(rear.x-.018,q.x))
                    left=tail.ray_cast(Vector((q.x,-5,q.z)),Vector((0,1,0)))[0]
                    right=tail.ray_cast(Vector((q.x,5,q.z)),Vector((0,-1,0)))[0]
                    if left is not None and right is not None:
                        q.y=max(left.y+.007,min(right.y-.007,q.y))
                else:
                    top=tail.ray_cast(Vector((q.x,q.y,1.24)),Vector((0,0,-1)))[0]
                    bottom=tail.ray_cast(Vector((q.x,q.y,0)),Vector((0,0,1)))[0]
                    if top is not None and bottom is not None:
                        q.z=max(bottom.z+.006,min(top.z-.006,q.z))
                v.co=inv@q
                continue
            candidates=[]
            if ids[c] in ['motores','eletrico','vacuo_pitot','combustivel','estrutura'] and c not in wing_components and -2.8<q.x<-.1 and 1.45<abs(q.y)<2.34:
                candidates=[tree for name,tree in shells.items() if name.startswith('07 Carenagem')]
            elif c in {'longarina_principal','longarina_traseira'} or ((c in wing_components or (ids[c] in ['eletrico','vacuo_pitot','combustivel'] and c!='tubo_pitot')) and abs(q.y)>.55):
                candidates=[tree for name,tree in shells.items() if name.startswith('05 Asa')]
            elif (c in body_components or ids[c] in ['eletrico','vacuo_pitot','combustivel']) and abs(q.y)<.8:
                candidates=[tree for name,tree in shells.items() if name.startswith('01 ')]
            if candidates:
                candidates += [tree for name,tree in shells.items() if name.startswith(('05 Asa','01 ')) and tree not in candidates]
            for tree in candidates:
                top=tree.ray_cast(Vector((q.x,q.y,5)),Vector((0,0,-1)))[0]
                bottom=tree.ray_cast(Vector((q.x,q.y,-2)),Vector((0,0,1)))[0]
                if top is not None and bottom is not None and top.z-bottom.z>.015:
                    margin=min(.018,(top.z-bottom.z)*.15)
                    if c in {'longarina_principal','longarina_traseira'}:
                        # Mapear a seção inteira, sem esmagar mesa/alma contra o teto.
                        # Envelope original: eixo .8 + |Y|*.108, raio máximo < .09.
                        t=(q.z-(.8+abs(q.y)*.108)+.09)/.18
                        assert 0 <= t <= 1, 'Longarina fora do envelope de geração'
                        q.z=bottom.z+margin+t*(top.z-bottom.z-2*margin)
                    else:
                        q.z=max(bottom.z+margin,min(top.z-margin,q.z))
                    break
            # Cavernas também seguem a largura da pele, não só o teto/piso.
            if c=='semimonocoque_caixilhos':
                tree=next(tree for name,tree in shells.items() if name.startswith('01 '))
                origin=Vector((q.x,0,1.18)); direction=q-origin
                if direction.length>.001:
                    hit=tree.ray_cast(origin,direction.normalized())[0]
                    if hit is not None and (hit-origin).length<direction.length+.018:
                        q=origin+direction.normalized()*max(.01,(hit-origin).length-.018)
            v.co=inv@q
# Consolidar por componente e lado para limitar draw calls, mantendo pivôs geométricos.
bpy.context.view_layer.update()
groups={}
for col in cols.values():
    for o in list(col.objects):
        pts=[o.matrix_world@Vector(v) for v in o.bound_box]
        ys=[p.y for p in pts]
        side='esq' if max(ys)<-.05 else 'dir' if min(ys)>.05 else 'centro'
        groups.setdefault((o['componentId'],side),[]).append(o)
for (c,side),objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join(); o=bpy.context.object; o.name=c+'__'+side
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY',center='BOUNDS')
    tag(o,c); o['side']=side; o['anchor']=[0.,0.,0.]; o['schematic']=ids[c] not in ['exterior','controles_voo']
# Remover coleções herdadas após realocar todos os objetos aeronáuticos.
for c in list(bpy.data.collections):
    if c.name not in cols: bpy.data.collections.remove(c)
assert {o['componentId'] for col in cols.values() for o in col.objects}==set(ids)
# Textures liées uniquement, compactes et embarquées. Images inutilisées exclues.
usedm={m for col in cols.values() for o in col.objects for m in o.data.materials}
for m in usedm:
    if m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type=='TEX_IMAGE' and n.image and n.outputs['Color'].is_linked:
                img=n.image
                if img.size[0]>2048: img.scale(2048,1024)
                img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(output))
model=ROOT/'public/models/pa34-camadas.glb'; model.parent.mkdir(exist_ok=True,parents=True)
bpy.ops.object.select_all(action='DESELECT')
for col in cols.values():
    for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(model),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_draco_mesh_compression_enable=False,export_image_format='AUTO')
# Manifesto derivado do GLB efetivamente escrito (não dos nomes pré-exportação).
import struct
raw=model.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]; gltf=json.loads(raw[20:20+length])
nodes=[]
for i,n in enumerate(gltf['nodes']):
    if 'mesh' not in n: continue
    e=n['extras']; nodes.append({'node':i,'name':n['name'],**{k:e[k] for k in ['componentId','layerId','side','anchor']}})
triangles=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
manifest={'schemaVersion':1,'asset':'pa34-camadas.glb','sha256':hashlib.sha256(raw).hexdigest(),'source':{'file':source.name,'sha256':source_hash},'coordinates':'glTF Y-up; wrapper: rotation Y=pi, scale=4.7/5.93994, translation Y=-1.1','disclaimer':'Representação didática. Anatomia interna esquemática, sem cotas de instalação certificadas.','layers':list(cols),'nodes':nodes,'metrics':{'bytes':len(raw),'triangles':triangles,'materials':len(gltf.get('materials',[])),'primitives':sum(len(m['primitives']) for m in gltf['meshes']),'nodes':len(nodes),'components':len(set(n['componentId'] for n in nodes))}}
(ROOT/'public/models/pa34-camadas.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
assert hashlib.sha256(source.read_bytes()).hexdigest()==source_hash
print('PA34_METRICS',json.dumps(manifest['metrics']))
if args.render or args.render_layer:
    scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=24
    scene.render.resolution_x=1200; scene.render.resolution_y=900; scene.render.resolution_percentage=100
    scene.world.color=(.22,.22,.22)
    bpy.ops.object.camera_add(location=(-10,-12,8)); cam=bpy.context.object
    cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=14; scene.camera=cam
    for loc,energy,size in [((-5,-6,10),1800,8),((3,5,7),1500,7),((0,-3,4),500,5)]:
        bpy.ops.object.light_add(type='AREA',location=loc); light=bpy.context.object; light.data.energy=energy; light.data.shape='DISK'; light.data.size=size; light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
    folder=ROOT/'blender/renders'; folder.mkdir(exist_ok=True)
    render_names=args.render_layer or ['montado',*cols]
    assert all(name in ['montado',*cols] for name in render_names), 'Coleção de render desconhecida'
    for name in render_names:
        for key,col in cols.items():
            for o in col.objects: o.hide_render=name!='montado' and key!=name
        points=[o.matrix_world@Vector(v) for col in cols.values() for o in col.objects if not o.hide_render for v in o.bound_box]
        lo=Vector([min(v[i] for v in points) for i in range(3)]); hi=Vector([max(v[i] for v in points) for i in range(3)])
        center=(lo+hi)/2; cam.location=center+Vector((8,-10,6) if name=='avionics_cabine' else (-10,-12,8))
        cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
        inv=cam.rotation_euler.to_matrix().transposed(); projected=[inv@(v-center) for v in points]
        width=max(v.x for v in projected)-min(v.x for v in projected); height=max(v.y for v in projected)-min(v.y for v in projected)
        rotation=cam.rotation_euler.to_matrix()
        shift=rotation@Vector(((max(v.x for v in projected)+min(v.x for v in projected))/2,(max(v.y for v in projected)+min(v.y for v in projected))/2,0))
        cam.location+=shift
        cam.data.ortho_scale=max(width,height*4/3)*1.18
        scene.render.filepath=str(folder/(name+'.png')); bpy.ops.render.render(write_still=True)
