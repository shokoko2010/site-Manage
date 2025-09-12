"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  Mail, 
  Shield, 
  Crown,
  UserCheck,
  UserX,
  Edit,
  Trash2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'USER' as const,
    plan: 'BASIC' as const
  });

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Mock team data - in real app this would fetch from API
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'ADMIN',
          plan: 'ENTERPRISE',
          isActive: true,
          createdAt: '2024-01-15T00:00:00Z',
          lastLogin: '2024-04-10T10:30:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'USER',
          plan: 'BASIC',
          isActive: true,
          createdAt: '2024-02-20T00:00:00Z',
          lastLogin: '2024-04-09T15:45:00Z'
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'USER',
          plan: 'FREE',
          isActive: false,
          createdAt: '2024-03-10T00:00:00Z'
        }
      ];

      setTeamMembers(mockTeamMembers);
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Mock API call - in real app this would call the API
      const newTeamMember: TeamMember = {
        id: Date.now().toString(),
        ...newMember,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      setTeamMembers([...teamMembers, newTeamMember]);
      setShowAddDialog(false);
      setNewMember({ name: '', email: '', role: 'USER', plan: 'BASIC' });
      
    } catch (err) {
      setError('Failed to add team member');
    }
  };

  const handleToggleStatus = async (memberId: string) => {
    try {
      setTeamMembers(teamMembers.map(member => 
        member.id === memberId 
          ? { ...member, isActive: !member.isActive }
          : member
      ));
    } catch (err) {
      setError('Failed to update member status');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800';
      case 'PREMIUM':
        return 'bg-green-100 text-green-800';
      case 'BASIC':
        return 'bg-blue-100 text-blue-800';
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 flex">
            <span className="font-bold text-xl">Zex-Content</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a href="/appboard" className="text-muted-foreground hover:text-foreground">Appboard</a>
              <a href="/content" className="text-muted-foreground hover:text-foreground">Content</a>
              <a href="/sites" className="text-muted-foreground hover:text-foreground">Sites</a>
              <a href="/analytics" className="text-muted-foreground hover:text-foreground">Analytics</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/appboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center space-x-2">
                  <Users className="h-8 w-8" />
                  <span>Team Management</span>
                </h1>
                <p className="text-muted-foreground">Manage your team members and their permissions</p>
              </div>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>
                    Invite a new member to join your team
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newMember.role} onValueChange={(value: any) => setNewMember({...newMember, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Select value={newMember.plan} onValueChange={(value: any) => setNewMember({...newMember, plan: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Member</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {teamMembers.filter(m => m.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.role === 'ADMIN' || m.role === 'SUPER_ADMIN').length}
                </div>
                <p className="text-xs text-muted-foreground">With admin access</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Plans</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.plan === 'PREMIUM' || m.plan === 'ENTERPRISE').length}
                </div>
                <p className="text-xs text-muted-foreground">Premium or Enterprise</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team members and their access levels</CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members found</p>
                  <p className="text-sm">Add your first team member to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-medium text-sm">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{member.name}</h3>
                            {member.isActive ? (
                              <Badge variant="outline" className="text-xs bg-green-50">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-red-50">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </span>
                            <span>•</span>
                            <span>Joined {formatDate(member.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                            {member.role}
                          </Badge>
                          <Badge className={`text-xs ${getPlanColor(member.plan)}`}>
                            {member.plan}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(member.id)}
                          >
                            {member.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}