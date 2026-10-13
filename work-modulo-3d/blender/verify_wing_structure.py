"""Regressão das longarinas: vértices E interiores das faces contra a pele das asas.
Executar no .blend gerado com Blender --background --python-exit-code 1.
Somente leitura; amostragem de 40 mm, tolerância numérica de 2 mm.
Não certifica instalações nem substitui inspeção visual.
"""
import math
import json
import sys
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

# Repetir a medição no recurso servido, sem salvar a cena de inspeção.
if '--glb' in sys.argv:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    asset = Path(__file__).resolve().parents[1] / 'public/models/pa34-camadas.glb'
    bpy.ops.import_scene.gltf(filepath=str(asset))
    bpy.context.view_layer.update()

COMPONENTS = {'longarina_principal', 'longarina_traseira'}
SKIN = {'asa_externa_esq_dir', 'flaps_superficies', 'ailerons'}
vertices, faces = [], []
for obj in bpy.data.objects:
    if obj.type != 'MESH' or obj.get('componentId') not in SKIN:
        continue
    offset = len(vertices)
    vertices.extend(obj.matrix_world @ v.co for v in obj.data.vertices)
    faces.extend(tuple(offset + i for i in f.vertices) for f in obj.data.polygons)
assert faces, 'Pele das asas ausente'
tree = BVHTree.FromPolygons(vertices, faces)
objects = [o for o in bpy.data.objects if o.type == 'MESH' and o.get('componentId') in COMPONENTS]
assert {(o['componentId'], o.get('side')) for o in objects} == {
    (c, side) for c in COMPONENTS for side in ('esq', 'dir')
}, 'Longarinas ausentes ou sem lateralidade'
assert len(objects) == 4, 'Conjunto inesperado de longarinas'


def measure(obj, mutation=None):
    obj.data.calc_loop_triangles()
    points = [obj.matrix_world @ v.co for v in obj.data.vertices]
    count = misses = outside = face_samples = root_samples = 0
    worst = -math.inf
    def check(p, interior=False):
        nonlocal count, misses, outside, worst, face_samples, root_samples
        count += 1
        face_samples += interior
        root_samples += abs(p.y) < .55
        dz = .25 if (mutation == 'faces' and interior) or (mutation == 'raizes' and abs(p.y) < .55) else 0
        top = tree.ray_cast(Vector((p.x, p.y, 10)), Vector((0, 0, -1)))[0]
        bottom = tree.ray_cast(Vector((p.x, p.y, -10)), Vector((0, 0, 1)))[0]
        if top is None or bottom is None:
            misses += 1
            return
        gap = max(p.z + dz - top.z, bottom.z - p.z - dz)
        worst = max(worst, gap)
        outside += gap > .002
    for p in points:
        check(p)
    for tri in obj.data.loop_triangles:
        a, b, c = (points[i] for i in tri.vertices)
        steps = max(3, math.ceil(max((a-b).length, (b-c).length, (c-a).length) / .04))
        for i in range(1, steps):
            for j in range(1, steps-i):
                check(a + (b-a)*(i/steps) + (c-a)*(j/steps), True)
        check((a+b+c)/3, True)
    return {'object': obj.name, 'samples': count, 'misses': misses,
            'faceSamples': face_samples, 'rootSamples': root_samples,
            'degenerateFaces': sum(f.area < 1e-10 for f in obj.data.polygons),
            'outside': outside, 'maxOutsideMeters': worst}


def validate(reports):
    assert reports and all(r['samples'] > 0 for r in reports), 'Amostragem vazia'
    assert all(r['faceSamples'] > 0 and r['rootSamples'] > 0 for r in reports), 'Faces/raízes não amostradas'
    assert all(r['degenerateFaces'] == 0 for r in reports), 'Faces degeneradas na estrutura'
    assert all(r['misses'] == 0 for r in reports), 'Pele não medida em parte da estrutura'
    assert all(r['outside'] == 0 for r in reports), 'Longarina atravessa a pele'


reports = [measure(o) for o in objects]
print('WING_STRUCTURE', json.dumps(reports))
validate(reports)
for mutation in ('faces', 'raizes'):
    altered = measure(objects[0], mutation)
    assert altered['outside'] > 0, 'Mutação não exercitou a região esperada'
    try:
        validate([altered])
    except AssertionError:
        print('NEGATIVE_PASS: deslocamento virtual restrito a', mutation)
    else:
        raise AssertionError('Regressão: teste aceitou região deslocada')
print('PASS: longarinas contidas nos pontos amostrados, incluindo faces e raízes')
