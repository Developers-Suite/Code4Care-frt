import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Lock, Mail, Shield } from "lucide-react";

interface AdminLoginProps {
  onAdminLogin: () => void;
  onBack: () => void;
}

export function AdminLogin({ onAdminLogin, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onAdminLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f9fa' }}>
      <Card className="max-w-md w-full p-8 shadow-lg" style={{ backgroundColor: 'white' }}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#006d77' }}>
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-2" style={{ color: '#006d77' }}>Admin Access</h1>
          <p className="text-gray-600">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="admin-email" className="text-gray-700">Email</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lydiacontactcenter.org"
                className="pl-10 rounded-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="admin-password" className="text-gray-700">Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="pl-10 rounded-full"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full mt-6"
            style={{ backgroundColor: '#006d77', color: 'white' }}
            disabled={!email.trim() || !password.trim()}
          >
            Sign In as Admin
          </Button>
        </form>

        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full rounded-full mt-4"
          style={{ color: '#006d77' }}
        >
          Back to User Login
        </Button>
      </Card>
    </div>
  );
}
