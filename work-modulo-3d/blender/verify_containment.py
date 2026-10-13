"""Triagem somente leitura. Cobertura parcial nunca é declarada contenção completa.
--strict-coverage reprova qualquer vértice sem dois raios; não deformar a malha para passar.
"""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
checked={'longarina_principal','longarina_traseira','semimonocoque_caixilhos','tanque_principal_esq','tanque_principal_dir','tanque_auxiliar_esq','tanque_auxiliar_dir','assentos','reguladores_vacuo','bombas_vacuo','valvula_retencao_filtros','linhas_crossfeed','alternadores','estrutura_empenagem','reguladores_ov','reles_partida_master','bateria','sistema_injecao','radiador_oleo','governadores_magnetos','iluminacao_interna','aquecimento_ventilacao'}
manifest=json.loads((Path(__file__).resolve().parents[1]/'public/models/pa34-camadas.manifest.json').read_text())
expected={n['name']:n['componentId'] for n in manifest['nodes'] if n['componentId'] in checked}
assert set(expected.values())==checked,'Manifesto não contém componentes esperados da auditoria'
verts=[];faces=[]
for o in bpy.data.objects:
    if o.type!='MESH' or not (o.get('layerId')=='exterior' or o.get('componentId') in {'ailerons','flaps_superficies','stabilator_tab','leme_tab'}): continue
    start=len(verts);verts.extend(o.matrix_world@v.co for v in o.data.vertices)
    faces.extend(tuple(start+i for i in f.vertices) for f in o.data.polygons)
assert faces,'Casca externa ausente'
tree=BVHTree.FromPolygons(verts,faces)
objects=[o for o in bpy.data.objects if o.type=='MESH' and o.get('componentId') in checked]
def measure(items, moved=None):
    assert {o.name:o['componentId'] for o in items}==expected,'Objetos auditados ausentes ou inesperados'
    report=[]
    for o in items:
        outside=[];misses=[];covered=0
        assert len(o.data.vertices)>0,'Objeto sem vértices'
        for v in o.data.vertices:
            p=o.matrix_world@v.co
            if moved==o.name:p.x+=100 # mutação virtual, sem alterar o Blender
            axis=1 if o['componentId']=='estrutura_empenagem' and p.z>1.25 else 2
            start=p.copy();start[axis]=10
            direction=Vector((0,0,0));direction[axis]=-1
            top=tree.ray_cast(start,direction)[0]
            start[axis]=-10;direction[axis]=1
            bottom=tree.ray_cast(start,direction)[0]
            if top is None or bottom is None:
                misses.append(v.index);continue
            covered+=1
            if p[axis]>top[axis]+.025 or p[axis]<bottom[axis]-.025:outside.append(v.index)
        report.append({'component':o['componentId'],'object':o.name,'vertices':len(o.data.vertices),
                       'covered':covered,'misses':len(misses),'coverage':covered/len(o.data.vertices),
                       'outside25mm':len(outside),'missingExamples':misses[:3],'outsideExamples':outside[:3]})
    return report
def validate(report,strict=False):
    assert report and len(report)==len(expected),'Conjunto auditado vazio/incompleto'
    assert all(r['covered']>0 for r in report),'Objeto inteiramente não medido; contenção não demonstrada'
    assert all(r['outside25mm']==0 for r in report),'Vértices medidos ultrapassam a pele mais de 25 mm'
    if strict:assert all(r['misses']==0 for r in report),'Contenção completa não demonstrada: cobertura parcial'
report=measure(objects)
print('CONTAINMENT',json.dumps({'status':'parcial' if any(r['misses'] for r in report) else 'completa_nos_objetos_auditados','objects':report}))
validate(report,'--strict-coverage' in sys.argv)
for name,test in [('objeto ausente',lambda:measure(objects[1:])),('objeto fora da casca',lambda:validate(measure(objects,objects[0].name))),('conjunto vazio',lambda:validate([]))]:
    try:test()
    except AssertionError:print('NEGATIVE_PASS',name)
    else:raise AssertionError('Mutação aceita: '+name)
print('Verificação dos vértices MEDIDOS concluída; ver misses/cobertura. Não certifica regiões não medidas nem instalações.')
