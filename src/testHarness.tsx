import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminPanel } from './src/components/AdminPanel';
import { SupportCounselorDashboard } from './src/components/ConsultantDashboard';
import { StaffSession } from './src/services/staffAccessService';

const mockAdminSession: StaffSession = {
  accessToken: 'mock-access-token',
  role: 'admin',
  staffId: 'staff-1',
  name: 'Admin User',
  email: 'admin@example.com',
};

const mockConsultantSession: StaffSession = {
  accessToken: 'mock-access-token',
  role: 'consultant',
  staffId: 'staff-2',
  name: 'Counselor User',
  email: 'counselor@example.com',
};

export function TestHarness() {
  const [view, setView] = React.useState<'admin' | 'consultant'>('admin');

  return (
    <div>
      <div style={{ padding: '8px', background: '#333', color: '#fff', display: 'flex', gap: '10px' }}>
        <button onClick={() => setView('admin')}>Test Admin View</button>
        <button onClick={() => setView('consultant')}>Test Consultant View</button>
      </div>
      {view === 'admin' ? (
        <AdminPanel selectedLanguage="en" onLogout={() => {}} session={mockAdminSession} />
      ) : (
        <SupportCounselorDashboard session={mockConsultantSession} onLogout={() => {}} />
      )}
    </div>
  );
}
