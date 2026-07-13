import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '../components/AppShell'
import { PageTransition } from '../components/PageTransition/PageTransition'
import { HelpSupportScreen } from '../screens/HelpSupportScreen/HelpSupportScreen'
import { HomeScreen } from '../screens/HomeScreen/HomeScreen'
import { InstallScreen } from '../screens/InstallScreen/InstallScreen'
import { LoginScreen } from '../screens/LoginScreen/LoginScreen'
import { ProfileEmailEditScreen } from '../screens/ProfileEmailEditScreen'
import { ProfileDetailScreen } from '../screens/ProfileEmailLoginScreen'
import { ProfileNicknameEditScreen } from '../screens/ProfileNicknameEditScreen'
import { ProfilePasswordEditScreen } from '../screens/ProfilePasswordEditScreen'
import { QrCodeScanPromptInstallScreen } from '../screens/QrCodeScanPromptInstallScreen'
import { QrCodeScanPromptLoginScreen } from '../screens/QrCodeScanPromptLoginScreen'
import { ReceiptsListScreen } from '../screens/ReceiptsListScreen/ReceiptsListScreen'
import { SignUpScreen } from '../screens/SignUpScreen/SignUpScreen'
import { TreatJarScreen } from '../screens/TreatJarScreen/TreatJarScreen'
import { VendorScreen } from '../screens/VendorScreen/VendorScreen'
import { VendorScanScreen } from '../screens/VendorScanScreen/VendorScanScreen'
import { MyQrScreen } from '../screens/MyQrScreen/MyQrScreen'

export function AppRoutes() {
  return (
    <AppShell>
      <PageTransition>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/verify-email" element={<HomeScreen />} />
          <Route path="/help-support" element={<HelpSupportScreen />} />
          <Route path="/install" element={<InstallScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/profile-email-login" element={<ProfileDetailScreen />} />
          <Route path="/profile-google-login" element={<ProfileDetailScreen />} />
          <Route path="/profile-email-login/edit-nickname" element={<ProfileNicknameEditScreen />} />
          <Route path="/profile-google-login/edit-nickname" element={<ProfileNicknameEditScreen />} />
          <Route path="/profile-email-login/edit-email" element={<ProfileEmailEditScreen />} />
          <Route path="/profile-email-login/edit-password" element={<ProfilePasswordEditScreen />} />
          <Route path="/qr-code-scan-prompt-install" element={<QrCodeScanPromptInstallScreen />} />
          <Route path="/qr-code-scan-prompt-login" element={<QrCodeScanPromptLoginScreen />} />
          <Route path="/sign-up" element={<SignUpScreen />} />
          <Route path="/receipts" element={<ReceiptsListScreen />} />
          <Route path="/treat-jar" element={<TreatJarScreen />} />
          <Route path="/scan" element={<VendorScanScreen />} />
          <Route path="/my-qr" element={<MyQrScreen />} />
          <Route path="/vendor/:vendorId/:tab/:rewardId" element={<VendorScreen />} />
          <Route path="/vendor/:vendorId/:tab?" element={<VendorScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AppShell>
  )
}
