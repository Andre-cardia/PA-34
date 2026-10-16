import { BrowserRouter, Navigate, Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import { ROUTER_BASENAME } from '@/lib/asset'
import Home from '@/pages/Home'
import Modelo3D from '@/pages/Modelo3D'
import Cockpit from '@/pages/Cockpit'
import Especificacoes from '@/pages/Especificacoes'
import Performance from '@/pages/Performance'
import Sistemas from '@/pages/Sistemas'
import Procedimentos from '@/pages/Procedimentos'
import Multimotor from '@/pages/Multimotor'
import Emergencias from '@/pages/Emergencias'
import Seguranca from '@/pages/Seguranca'

export default function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="modelo-3d" element={<Modelo3D />} />
          <Route path="cockpit" element={<Cockpit />} />
          <Route path="especificacoes" element={<Especificacoes />} />
          <Route path="performance" element={<Performance />} />
          <Route path="sistemas" element={<Sistemas />} />
          <Route path="procedimentos" element={<Procedimentos />} />
          <Route path="multimotor" element={<Multimotor />} />
          <Route path="emergencias" element={<Emergencias />} />
          <Route path="seguranca" element={<Seguranca />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
