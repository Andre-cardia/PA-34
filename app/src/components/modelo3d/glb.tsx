// Integração do modelo real PA-34 (GLB) com o sistema de camadas do módulo 3D.
// Fonte do modelo: FlightGear fgaddon — Aircraft/SenecaII (PA34-200T, GPL-2.0),
// convertido para GLB com nós nomeados. Mesma célula do Seneca I.
//
// Eixos do GLB: X = comprimento (nariz em -X), Y = vertical, Z = envergadura
// (lado esquerdo em +Z). O wrapper GLB_WRAP rotaciona 180° em Y para alinhar ao
// referencial da cena (nariz +X, +Z = direita) e escala para a envergadura da
// maquete procedural original (±4.7).

import { useMemo, useContext, createContext } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import nodeMapJson from '@/data/seneca-node-map.json'
import type { LayerId } from './config'

export const GLB_URL = `${import.meta.env.BASE_URL}models/seneca-pa34.glb`
export const GLB_SCALE = 4.7 / 5.841 // ≈ 0.8046 — envergadura da cena / envergadura do GLB
export const GLB_Y = -1.1 // assenta as rodas no plano do modelo procedural

interface NodeEntry {
  layer: string
  center: [number, number, number]
}
const NODE_MAP = (nodeMapJson as unknown as { nodes: Record<string, NodeEntry> }).nodes

// ---------------------------------------------------------------------------
// Mapeamento nó GLB → (camada, componente do componentes_3d.json)
// Camadas cobertas pelo GLB: exterior, motores, combustivel, trem_pouso,
// controles_voo, avionics_cabine. Overrides sobre o manifesto quando a
// classificação automática diverge do design (janelas/portas → exterior etc.)
// ---------------------------------------------------------------------------

type CompAssign = { camada: LayerId; comp: string }

const EXACT: Record<string, CompAssign> = {
  // --- exterior: fuselagem, asas, empenagem, carenagens ---
  'Fuselage.002': { camada: 'exterior', comp: 'fuselagem_externa' },
  Chassis: { camada: 'exterior', comp: 'fuselagem_externa' },
  LeftWing: { camada: 'exterior', comp: 'asa_externa_esq_dir' },
  RightWing: { camada: 'exterior', comp: 'asa_externa_esq_dir' },
  Fin: { camada: 'exterior', comp: 'empenagem_externa' },
  LeftEngineNacelle: { camada: 'exterior', comp: 'naceles_carenagens' },
  RightEngineNacelle: { camada: 'exterior', comp: 'naceles_carenagens' },
  // --- exterior: envidraçado e portas ---
  WindScreen: { camada: 'exterior', comp: 'para_brisa_janelas' },
  PilotWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  LeftCenterWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  RightCenterWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  LeftPaxWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  RightPaxWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  RightFrontWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  BaggageDoorWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  RightBaggageWindow: { camada: 'exterior', comp: 'para_brisa_janelas' },
  WindshieldDeice: { camada: 'exterior', comp: 'para_brisa_janelas' },
  RightDoor: { camada: 'exterior', comp: 'portas_bagageiros' },
  PaxDoorFrame: { camada: 'exterior', comp: 'portas_bagageiros' },
  BaggageDoorFrame: { camada: 'exterior', comp: 'portas_bagageiros' },
  DoorLockHandleFront: { camada: 'exterior', comp: 'portas_bagageiros' },
  'DoorLockHandleFront.002': { camada: 'exterior', comp: 'portas_bagageiros' },
  // --- exterior: extremidades, luzes, fibra do nariz ---
  LeftPositionLight: { camada: 'exterior', comp: 'pontas_asa_nariz_fibra' },
  RightPositionLight: { camada: 'exterior', comp: 'pontas_asa_nariz_fibra' },
  LandingLight: { camada: 'exterior', comp: 'pontas_asa_nariz_fibra' },
  TaxiLight: { camada: 'exterior', comp: 'pontas_asa_nariz_fibra' },
  TaxiLandingLightChassis: { camada: 'exterior', comp: 'pontas_asa_nariz_fibra' },
  Step: { camada: 'exterior', comp: 'pontas_asa_nariz_fibra' },
  // --- motores ---
  'LeftPropeller.1': { camada: 'motores', comp: 'helice_esquerda' },
  'LeftPropeller.2': { camada: 'motores', comp: 'helice_esquerda' },
  LeftSpinner: { camada: 'motores', comp: 'helice_esquerda' },
  'RightPropeller.1': { camada: 'motores', comp: 'helice_direita' },
  'RightPropeller.2': { camada: 'motores', comp: 'helice_direita' },
  RightSpinner: { camada: 'motores', comp: 'helice_direita' },
  LeftExhaust: { camada: 'motores', comp: 'escapamento_crossover' },
  RightExaust: { camada: 'motores', comp: 'escapamento_crossover' },
  LeftCowlFlap: { camada: 'motores', comp: 'cowl_flaps_comp' },
  RightCowlFlap: { camada: 'motores', comp: 'cowl_flaps_comp' },
  // --- combustível ---
  'TankCover.L': { camada: 'combustivel', comp: 'tanque_auxiliar_esq' },
  'TankCover.R': { camada: 'combustivel', comp: 'tanque_auxiliar_dir' },
  'AVGAS.L': { camada: 'combustivel', comp: 'tanque_principal_esq' },
  'AVGAS.R': { camada: 'combustivel', comp: 'tanque_principal_dir' },
  'FuelSelectorControl.L': { camada: 'combustivel', comp: 'seletoras_valvulas' },
  'FuelSelectorControl.R': { camada: 'combustivel', comp: 'seletoras_valvulas' },
  'Label.FuelSelector': { camada: 'combustivel', comp: 'seletoras_valvulas' },
  'Label.FuelOn': { camada: 'combustivel', comp: 'seletoras_valvulas' },
  'Label.FuelCrossfeed': { camada: 'combustivel', comp: 'seletoras_valvulas' },
  'Label.FuelSelectorCover': { camada: 'combustivel', comp: 'seletoras_valvulas' },
  // --- trem de pouso ---
  NLG_Wheel: { camada: 'trem_pouso', comp: 'perna_dianteira' },
  NLG_Axle: { camada: 'trem_pouso', comp: 'perna_dianteira' },
  NLG_Leg: { camada: 'trem_pouso', comp: 'perna_dianteira' },
  NLG_Strut: { camada: 'trem_pouso', comp: 'perna_dianteira' },
  NLG_TorqueLinkLower: { camada: 'trem_pouso', comp: 'perna_dianteira' },
  NLG_TorqueLinkUpper: { camada: 'trem_pouso', comp: 'perna_dianteira' },
  NosegearBox: { camada: 'trem_pouso', comp: 'portas_pocos' },
  LeftMainGearCover: { camada: 'trem_pouso', comp: 'portas_pocos' },
  RightMainGearCover: { camada: 'trem_pouso', comp: 'portas_pocos' },
  LeftNosegearCover: { camada: 'trem_pouso', comp: 'portas_pocos' },
  RightNosegearCover: { camada: 'trem_pouso', comp: 'portas_pocos' },
  GearLever: { camada: 'trem_pouso', comp: 'indicacao_aviso_trem' },
  GearLeverNut: { camada: 'trem_pouso', comp: 'indicacao_aviso_trem' },
  GearSpeedPlacard: { camada: 'trem_pouso', comp: 'indicacao_aviso_trem' },
  GearEmergencyKnob: { camada: 'trem_pouso', comp: 'sistema_emergencia' },
  GearEmergencySecure: { camada: 'trem_pouso', comp: 'sistema_emergencia' },
  // --- controles de voo ---
  LeftAileron: { camada: 'controles_voo', comp: 'ailerons' },
  RightAileron: { camada: 'controles_voo', comp: 'ailerons' },
  LeftFlap: { camada: 'controles_voo', comp: 'flaps_superficies' },
  RightFlap: { camada: 'controles_voo', comp: 'flaps_superficies' },
  FlapControl: { camada: 'controles_voo', comp: 'flaps_superficies' },
  FlapControlChassis: { camada: 'controles_voo', comp: 'flaps_superficies' },
  Rudder: { camada: 'controles_voo', comp: 'leme_tab' },
  Stabilizer: { camada: 'controles_voo', comp: 'stabilator_tab' },
  ElevatorTrimControl: { camada: 'controles_voo', comp: 'compensadores_comp' },
  ElevatorTrimIndicator: { camada: 'controles_voo', comp: 'compensadores_comp' },
  RudderTrimControl: { camada: 'controles_voo', comp: 'compensadores_comp' },
  RudderTrimIndicator: { camada: 'controles_voo', comp: 'compensadores_comp' },
  TrimwheelElevatorChassis: { camada: 'controles_voo', comp: 'compensadores_comp' },
  'TrimwheelElevator.1': { camada: 'controles_voo', comp: 'compensadores_comp' },
  'TrimwheelElevator.2': { camada: 'controles_voo', comp: 'compensadores_comp' },
  TrimwheelRudderChassis: { camada: 'controles_voo', comp: 'compensadores_comp' },
  TrimwheelRudder: { camada: 'controles_voo', comp: 'compensadores_comp' },
  // --- aviónicos / cabine ---
  Dashboard: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  'Dashboard-p1': { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  InstrumentCover: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  RPMPlacard: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  Compass: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  CompassAdjust: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  CompassCorrection: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  CompassCorrectionCover: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  DeviationTable: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  Chart1: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  Chart2: { camada: 'avionics_cabine', comp: 'painel_instrumentos' },
  CenterConsole: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  FrictionLock: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  ParkingBrakeControl: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  AlternateAir: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  AlternateAirLever: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  AltAirLabel: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  CowlFlapsControl: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  CowlFlapsControlLever: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  ThrottleControl: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  ThrottleControlLever: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  MixtureControl: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  MixtureControlLever: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  PropellerControl: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  PropellerControlLever: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  Label: { camada: 'avionics_cabine', comp: 'radios_coluna' },
  'Seat-': { camada: 'avionics_cabine', comp: 'assentos' },
  'Seat-12': { camada: 'avionics_cabine', comp: 'assentos' },
  'Seat-56': { camada: 'avionics_cabine', comp: 'assentos' },
  VHFAntenna1: { camada: 'avionics_cabine', comp: 'antenas' },
  VHFAntenna2: { camada: 'avionics_cabine', comp: 'antenas' },
  Beacon: { camada: 'avionics_cabine', comp: 'antenas' },
  'Overhead.CockpitLight': { camada: 'avionics_cabine', comp: 'iluminacao_interna' },
  'Overhead.CockpitLightSwitch': { camada: 'avionics_cabine', comp: 'iluminacao_interna' },
  'Overhead.CabinLighting': { camada: 'avionics_cabine', comp: 'iluminacao_interna' },
  'Overhead.CabinLightingSwitch': { camada: 'avionics_cabine', comp: 'iluminacao_interna' },
  PanelLightsDimmer: { camada: 'avionics_cabine', comp: 'iluminacao_interna' },
  RadioLightsDimmer: { camada: 'avionics_cabine', comp: 'iluminacao_interna' },
  'Overhead.AirVent': { camada: 'avionics_cabine', comp: 'aquecimento_ventilacao' },
  'Overhead.CabinHeating': { camada: 'avionics_cabine', comp: 'aquecimento_ventilacao' },
  Cabin: { camada: 'avionics_cabine', comp: 'assentos' },
}

// gear principal: todos os GearLeft.*/GearRight.* → pernas_principais
const PREFIX: [string, CompAssign][] = [
  ['GearLeft', { camada: 'trem_pouso', comp: 'pernas_principais' }],
  ['GearRight', { camada: 'trem_pouso', comp: 'pernas_principais' }],
]

// GLTFLoader sanitiza os nomes dos nós (PropertyBinding.sanitizeNodeName):
// remove `.` `:` `[` `]` `/` e troca espaços por `_`. 'Fuselage.002' vira
// 'Fuselage002' — normalizar os dois lados da busca ou os nós com ponto
// (fuselagem, hélices, trem, tanques) somem do modelo.
const sanitize = (n: string) => n.replace(/\s/g, '_').replace(/[\[\].:/]/g, '')
const EXACT_SAN: Record<string, CompAssign> = {}
for (const [k, v] of Object.entries(EXACT)) EXACT_SAN[sanitize(k)] = v
const NODE_MAP_SAN: Record<string, NodeEntry> = {}
for (const [k, v] of Object.entries(NODE_MAP)) NODE_MAP_SAN[sanitize(k)] = v

// fallback por camada do manifesto (nós genéricos box/cylinder do painel etc.)
const LAYER_DEFAULT: Record<string, string> = {
  exterior: 'fuselagem_externa',
  motores: 'motor_esquerdo',
  combustivel: 'seletoras_valvulas',
  trem_pouso: 'portas_pocos',
  controles_voo: 'compensadores_comp',
  avionics_cabine: 'seis_pack_piloto',
}

export function assignNode(rawName: string): CompAssign | null {
  const name = sanitize(rawName)
  const exact = EXACT_SAN[name]
  if (exact) return exact
  for (const [pre, a] of PREFIX) if (name.startsWith(pre)) return a
  const meta = NODE_MAP_SAN[name]
  if (!meta) return null
  const camada = meta.layer as LayerId
  return { camada, comp: LAYER_DEFAULT[camada] ?? 'fuselagem_externa' }
}

// ---------------------------------------------------------------------------
// useGlbParts — carrega o GLB e devolve os meshes agrupados por camada
// ---------------------------------------------------------------------------

export interface GlbMesh {
  name: string
  geometry: THREE.BufferGeometry
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  scale: THREE.Vector3
  comp: string
  side: 'esq' | 'dir' | 'centro'
}

export function useGlbParts(): Record<LayerId, GlbMesh[]> {
  const gltf = useGLTF(GLB_URL)
  return useMemo(() => {
    const out: Record<string, GlbMesh[]> = {}
    gltf.scene.updateMatrixWorld(true)
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scl = new THREE.Vector3()
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const assign = assignNode(mesh.name)
      if (!assign) return
      mesh.matrixWorld.decompose(pos, quat, scl)
      const side: GlbMesh['side'] = /left|\.L\b|\.L$/i.test(mesh.name)
        ? 'esq'
        : /right|\.R\b|\.R$/i.test(mesh.name)
          ? 'dir'
          : 'centro'
      ;(out[assign.camada] ??= []).push({
        name: mesh.name,
        geometry: mesh.geometry,
        position: pos.clone(),
        quaternion: quat.clone(),
        scale: scl.clone(),
        comp: assign.comp,
        side,
      })
    })
    return out as Record<LayerId, GlbMesh[]>
  }, [gltf])
}

// ---------------------------------------------------------------------------
// Contexto compartilhado de handlers (Part procedural e GlbPart usam o mesmo)
// ---------------------------------------------------------------------------

export interface PartHandlers {
  reg: (compId: string, camada: LayerId, obj: THREE.Object3D | null) => void
  hov: (e: ThreeEvent<PointerEvent>, compId: string | null, camada: LayerId | null) => void
  sel: (e: ThreeEvent<MouseEvent>, camada: LayerId, compId: string) => void
}

export const ModelPartCtx = createContext<PartHandlers>({ reg: () => undefined, hov: () => undefined, sel: () => undefined })

// ---------------------------------------------------------------------------
// GlbPart — mesh do GLB registrada como âncora clicável (mesmo contrato do Part)
// ---------------------------------------------------------------------------

interface GlbPartProps {
  mesh: GlbMesh
  mat: THREE.Material
  camada: LayerId
  noRay?: boolean
}

export function GlbPart({ mesh, mat, camada, noRay }: GlbPartProps) {
  const { reg, hov, sel } = useContext(ModelPartCtx)
  return (
    <mesh
      geometry={mesh.geometry}
      material={mat}
      position={mesh.position}
      quaternion={mesh.quaternion}
      scale={mesh.scale}
      userData={{ componenteId: mesh.comp, camada }}
      ref={(o: THREE.Mesh | null) => reg(mesh.comp, camada, o)}
      raycast={noRay ? () => null : undefined}
      onPointerOver={(e) => hov(e, mesh.comp, camada)}
      onPointerOut={(e) => hov(e, null, null)}
      onClick={(e) => sel(e, camada, mesh.comp)}
    />
  )
}

// Wrapper com a transformação do referencial do GLB → referencial da cena
export function GlbWrap({ children }: { children: React.ReactNode }) {
  return (
    <group rotation={[0, Math.PI, 0]} scale={GLB_SCALE} position={[0, GLB_Y, 0]}>
      {children}
    </group>
  )
}

useGLTF.preload(GLB_URL)
