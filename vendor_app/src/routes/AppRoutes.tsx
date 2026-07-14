import { Navigate, Route, Routes } from 'react-router-dom'

import AuthGate from '../components/AuthGate/AuthGate'
import MerchantShell from '../components/MerchantShell/MerchantShell'
import LoginScreen from '../screens/LoginScreen/LoginScreen'
import OnboardingScreen from '../screens/OnboardingScreen/OnboardingScreen'
import AddLocationScreen from '../screens/AddLocationScreen/AddLocationScreen'
import MyQrScreen from '../screens/MyQrScreen/MyQrScreen'
import ScanScreen from '../screens/ScanScreen/ScanScreen'
import PosScreen from '../screens/PosScreen/PosScreen'
import RewardsScreen from '../screens/RewardsScreen/RewardsScreen'
import InventoryScreen from '../screens/InventoryScreen/InventoryScreen'
import ActivityScreen from '../screens/ActivityScreen/ActivityScreen'
import PromosScreen from '../screens/PromosScreen/PromosScreen'
import SettingsScreen from '../screens/SettingsScreen/SettingsScreen'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<OnboardingScreen />} />

      <Route element={<AuthGate />}>
        <Route element={<MerchantShell />}>
          <Route path="/" element={<PosScreen />} />
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/my-qr" element={<MyQrScreen />} />
          <Route path="/activity" element={<ActivityScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/promos" element={<PromosScreen />} />
          <Route path="/rewards" element={<RewardsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/locations/add" element={<AddLocationScreen />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
