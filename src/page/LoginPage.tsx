import Login from '../auth/Login';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Login onSwitch={() => { /* TODO: implement switch logic */ }} />
    </div>
  );
}