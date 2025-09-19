import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

// Import Shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Separator } from './components/ui/separator';
import { Slider } from './components/ui/slider';
import { Calendar } from './components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { ScrollArea } from './components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';

// Import Lucide icons
import { 
  Heart, 
  Calendar as CalendarIcon, 
  Pill, 
  Activity, 
  Smile, 
  BookOpen, 
  Wind, 
  MapPin, 
  Clock, 
  Plus, 
  TrendingUp,
  Utensils,
  Search,
  Phone,
  Globe,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  User,
  Settings,
  LogOut,
  Users,
  Mail,
  Edit,
  Trash2,
  UserPlus,
  Target,
  Calendar as CalendarMilestone,
  Award,
  X
} from 'lucide-react';

import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]); // For caregivers

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
      
      // If user is a caregiver, fetch patients they care for
      if (response.data.role === 'caregiver') {
        fetchPatients();
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`, { withCredentials: true });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const login = async (sessionId) => {
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      
      const response = await axios.post(`${API}/auth/process-session`, formData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setPatients([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API}/profile`, profileData, { withCredentials: true });
      if (response.data.success) {
        // Refresh user data
        await checkAuthStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      patients,
      loading,
      login,
      logout,
      updateProfile,
      refreshAuth: checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Check for session_id in URL fragment
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      processSessionId(sessionId);
    }
  }, []);

  const processSessionId = async (sessionId) => {
    setProcessing(true);
    try {
      const success = await login(sessionId);
      if (success) {
        // Clear the URL fragment
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/dashboard');
      } else {
        alert('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Session processing error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-25 to-pink-25 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Setting up your account...</h3>
              <p className="text-gray-600">Please wait while we prepare your personalized HopeHub experience.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-25 to-pink-25 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 font-serif">Welcome to HopeHub</h1>
          <p className="text-gray-600">Your companion in wellness and healing</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In to Continue</CardTitle>
            <CardDescription>
              Access your personal health journey with secure authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              className="w-full bg-rose-500 hover:bg-rose-600"
              size="lg"
            >
              <Mail className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Coming Soon</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" disabled>
              <Mail className="w-5 h-5 mr-2" />
              Email & Password
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 mt-4">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                Your health data is encrypted and secure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Profile Page Component
const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [caregivers, setCaregivers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    personal_mantra: user?.personal_mantra || '',
    fighting_for: user?.fighting_for || '',
    diagnosis_date: user?.diagnosis_date || '',
    favorite_color: user?.favorite_color || '#ec4899',
    theme_preference: user?.theme_preference || 'soft'
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    date: '',
    milestone_type: 'treatment'
  });

  const [inviteForm, setInviteForm] = useState({
    caregiver_email: '',
    caregiver_name: ''
  });

  useEffect(() => {
    fetchCaregivers();
    fetchInvitations();
  }, []);

  const fetchCaregivers = async () => {
    try {
      const response = await axios.get(`${API}/caregivers`, { withCredentials: true });
      setCaregivers(response.data);
    } catch (error) {
      console.error('Error fetching caregivers:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`${API}/caregivers/invitations`, { withCredentials: true });
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const saveProfile = async () => {
    const success = await updateProfile(profileForm);
    if (success) {
      setEditing(false);
      alert('Profile updated successfully!');
    } else {
      alert('Failed to update profile. Please try again.');
    }
  };

  const addMilestone = async () => {
    try {
      const response = await axios.post(`${API}/profile/milestone`, milestoneForm, { withCredentials: true });
      if (response.data.success) {
        setMilestoneForm({
          title: '',
          description: '',
          date: '',
          milestone_type: 'treatment'
        });
        setShowAddMilestone(false);
        // Refresh auth to get updated milestones
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const inviteCaregiver = async () => {
    try {
      const response = await axios.post(`${API}/caregivers/invite`, inviteForm, { withCredentials: true });
      if (response.data.success) {
        setInviteForm({ caregiver_email: '', caregiver_name: '' });
        setShowInviteDialog(false);
        fetchInvitations();
        alert('Caregiver invitation sent successfully!');
      }
    } catch (error) {
      console.error('Error inviting caregiver:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const removeCaregiver = async (caregiverId) => {
    if (window.confirm('Are you sure you want to remove this caregiver?')) {
      try {
        await axios.delete(`${API}/caregivers/${caregiverId}`, { withCredentials: true });
        fetchCaregivers();
      } catch (error) {
        console.error('Error removing caregiver:', error);
      }
    }
  };

  const milestoneIcons = {
    diagnosis: AlertCircle,
    treatment: Activity,
    surgery: Heart,
    remission: CheckCircle,
    milestone: Award,
    other: CalendarMilestone
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 font-serif">Your Profile</h2>
        <p className="text-gray-600">Make your HopeHub experience uniquely yours</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <User className="w-5 h-5 text-rose-600" />
                <span>Personal Information</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editing ? saveProfile() : setEditing(true)}
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                {editing ? <CheckCircle className="w-4 h-4 mr-1" /> : <Edit className="w-4 h-4 mr-1" />}
                {editing ? 'Save' : 'Edit'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-rose-200 text-rose-700">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
                <Badge className="bg-rose-100 text-rose-700">Patient</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Personal Mantra</Label>
                {editing ? (
                  <Input
                    placeholder="Your daily motivation..."
                    value={profileForm.personal_mantra}
                    onChange={(e) => setProfileForm({...profileForm, personal_mantra: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-700 italic">
                    {user?.personal_mantra || "Add a personal mantra to inspire your journey"}
                  </p>
                )}
              </div>

              <div>
                <Label>Fighting For</Label>
                {editing ? (
                  <Input
                    placeholder="Who or what keeps you strong..."
                    value={profileForm.fighting_for}
                    onChange={(e) => setProfileForm({...profileForm, fighting_for: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {user?.fighting_for || "Share what motivates you in this journey"}
                  </p>
                )}
              </div>

              <div>
                <Label>Diagnosis Date</Label>
                {editing ? (
                  <Input
                    type="date"
                    value={profileForm.diagnosis_date}
                    onChange={(e) => setProfileForm({...profileForm, diagnosis_date: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {user?.diagnosis_date || "Add your diagnosis date"}
                  </p>
                )}
              </div>

              <div>
                <Label>Favorite Color</Label>
                {editing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={profileForm.favorite_color}
                      onChange={(e) => setProfileForm({...profileForm, favorite_color: e.target.value})}
                      className="w-12 h-8 rounded border"
                    />
                    <span className="text-sm text-gray-600">Personalize your interface</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: user?.favorite_color }}
                    ></div>
                    <span className="text-sm text-gray-700">{user?.favorite_color}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Milestones */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span>Treatment Milestones</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMilestone(true)}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.treatment_milestones?.map((milestone) => {
                const IconComponent = milestoneIcons[milestone.milestone_type] || Award;
                return (
                  <div key={milestone.id} className="bg-white p-3 rounded-lg shadow-sm flex items-start space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <IconComponent className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{milestone.date}</p>
                    </div>
                  </div>
                );
              })}

              {!user?.treatment_milestones?.length && (
                <div className="text-center py-4">
                  <Award className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                  <p className="text-gray-500">No milestones yet</p>
                  <p className="text-sm text-gray-400">Add important dates in your journey</p>
                </div>
              )}

              {showAddMilestone && (
                <div className="bg-white p-4 rounded-lg border space-y-3">
                  <Input
                    placeholder="Milestone title"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})}
                  />
                  <Input
                    type="date"
                    value={milestoneForm.date}
                    onChange={(e) => setMilestoneForm({...milestoneForm, date: e.target.value})}
                  />
                  <Select value={milestoneForm.milestone_type} onValueChange={(value) => setMilestoneForm({...milestoneForm, milestone_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagnosis">Diagnosis</SelectItem>
                      <SelectItem value="treatment">Treatment Start</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                      <SelectItem value="remission">Remission</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button onClick={addMilestone} className="bg-purple-500 hover:bg-purple-600">
                      Add Milestone
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMilestone(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Caregiver Management */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Caregiver Access</span>
            </span>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite Caregiver
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Caregiver</DialogTitle>
                  <DialogDescription>
                    Give trusted family members or friends access to your health journey
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      placeholder="Caregiver's name"
                      value={inviteForm.caregiver_name}
                      onChange={(e) => setInviteForm({...inviteForm, caregiver_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="caregiver@example.com"
                      value={inviteForm.caregiver_email}
                      onChange={(e) => setInviteForm({...inviteForm, caregiver_email: e.target.value})}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={inviteCaregiver} className="bg-blue-500 hover:bg-blue-600">
                      Send Invitation
                    </Button>
                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Share your health journey with trusted caregivers who can provide support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Active Caregivers */}
            <div>
              <h4 className="font-semibold mb-2">Active Caregivers</h4>
              <div className="space-y-2">
                {caregivers.map((caregiver) => (
                  <div key={caregiver.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={caregiver.picture} />
                        <AvatarFallback className="bg-blue-200 text-blue-700">
                          {caregiver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h5 className="font-medium">{caregiver.name}</h5>
                        <p className="text-sm text-gray-600">{caregiver.email}</p>
                        <p className="text-xs text-gray-500">
                          Access granted {new Date(caregiver.granted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCaregiver(caregiver.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {!caregivers.length && (
                  <div className="text-center py-4">
                    <Users className="w-12 h-12 text-blue-300 mx-auto mb-2" />
                    <p className="text-gray-500">No active caregivers</p>
                    <p className="text-sm text-gray-400">Invite family or friends to support your journey</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Pending Invitations</h4>
                <div className="space-y-2">
                  {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
                    <div key={invitation.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{invitation.caregiver_name}</h5>
                        <p className="text-sm text-gray-600">{invitation.caregiver_email}</p>
                        <p className="text-xs text-gray-500">
                          Invited {new Date(invitation.invited_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <span>Account Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={logout}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Navigation Component (updated)
const Navigation = ({ activeTab, setActiveTab, user, onProfileClick, onLogout }) => {
  return (
    <nav className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 px-6 py-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-serif">HopeHub</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name?.split(' ')[0]} 💙
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Today's gentle reminder:</p>
              <p className="text-sm font-medium text-rose-600">You are stronger than you know 💙</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onProfileClick}
                className="hover:bg-rose-100"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-rose-200 text-rose-700 text-xs">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="hover:bg-rose-100"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm h-auto p-1 gap-1">
            <TabsTrigger value="companion" className="flex items-center justify-center space-x-1 px-3 py-2 text-sm data-[state=active]:bg-rose-100 min-h-[2.5rem]">
              <Pill className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Cancer Companion</span>
              <span className="sm:hidden">Companion</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center justify-center space-x-1 px-3 py-2 text-sm data-[state=active]:bg-pink-100 min-h-[2.5rem]">
              <Utensils className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Nutrition Helper</span>
              <span className="sm:hidden">Nutrition</span>
            </TabsTrigger>
            <TabsTrigger value="mental" className="flex items-center justify-center space-x-1 px-3 py-2 text-sm data-[state=active]:bg-purple-100 min-h-[2.5rem]">
              <Smile className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Mental Health</span>
              <span className="sm:hidden">Mental</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center justify-center space-x-1 px-3 py-2 text-sm data-[state=active]:bg-blue-100 min-h-[2.5rem]">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Local Resources</span>
              <span className="sm:hidden">Resources</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
};

// Updated components (Cancer Companion, Nutrition Helper, Mental Health Buddy, Local Resource Finder)
// These are the same as before but with updated API calls using withCredentials
const CancerCompanion = () => {
  const [medications, setMedications] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  const [medForm, setMedForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    instructions: '',
    start_date: '',
    reminder_times: []
  });

  const [symptomForm, setSymptomForm] = useState({
    symptom_type: '',
    severity: [5],
    description: '',
    triggers: ''
  });

  const [appointmentForm, setAppointmentForm] = useState({
    appointment_type: '',
    doctor_name: '',
    location: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchMedications();
    fetchSymptoms();
    fetchAppointments();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await axios.get(`${API}/medications`, { withCredentials: true });
      setMedications(response.data);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const fetchSymptoms = async () => {
    try {
      const response = await axios.get(`${API}/symptoms`, { withCredentials: true });
      setSymptoms(response.data.slice(0, 10));
    } catch (error) {
      console.error('Error fetching symptoms:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`, { withCredentials: true });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const addMedication = async () => {
    try {
      const medData = {
        ...medForm,
        reminder_times: medForm.reminder_times || []
      };
      await axios.post(`${API}/medications`, medData, { withCredentials: true });
      setMedForm({
        medication_name: '',
        dosage: '',
        frequency: '',
        instructions: '',
        start_date: '',
        reminder_times: []
      });
      setShowAddMed(false);
      fetchMedications();
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  const addSymptom = async () => {
    try {
      const symptomData = {
        ...symptomForm,
        severity: symptomForm.severity[0]
      };
      await axios.post(`${API}/symptoms`, symptomData, { withCredentials: true });
      setSymptomForm({
        symptom_type: '',
        severity: [5],
        description: '',
        triggers: ''
      });
      setShowAddSymptom(false);
      fetchSymptoms();
    } catch (error) {
      console.error('Error adding symptom:', error);
    }
  };

  const addAppointment = async () => {
    try {
      await axios.post(`${API}/appointments`, appointmentForm, { withCredentials: true });
      setAppointmentForm({
        appointment_type: '',
        doctor_name: '',
        location: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      });
      setShowAddAppointment(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity <= 3) return 'bg-green-100 text-green-800';
    if (severity <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 font-serif">Your Health Journey</h2>
        <p className="text-gray-600">Track medications, symptoms, and appointments with gentle care</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medications */}
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Pill className="w-5 h-5 text-rose-600" />
              <span>Medications</span>
            </CardTitle>
            <CardDescription>Keep track of your medication schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-800">{med.medication_name}</h4>
                  <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                  <p className="text-xs text-gray-500">{med.instructions}</p>
                </div>
              ))}
              
              {!showAddMed ? (
                <Button
                  onClick={() => setShowAddMed(true)}
                  variant="outline"
                  className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              ) : (
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <Input
                    placeholder="Medication name"
                    value={medForm.medication_name}
                    onChange={(e) => setMedForm({...medForm, medication_name: e.target.value})}
                  />
                  <Input
                    placeholder="Dosage (e.g., 10mg)"
                    value={medForm.dosage}
                    onChange={(e) => setMedForm({...medForm, dosage: e.target.value})}
                  />
                  <Input
                    placeholder="Frequency (e.g., twice daily)"
                    value={medForm.frequency}
                    onChange={(e) => setMedForm({...medForm, frequency: e.target.value})}
                  />
                  <Input
                    placeholder="Special instructions"
                    value={medForm.instructions}
                    onChange={(e) => setMedForm({...medForm, instructions: e.target.value})}
                  />
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={medForm.start_date}
                    onChange={(e) => setMedForm({...medForm, start_date: e.target.value})}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={addMedication} className="bg-rose-500 hover:bg-rose-600">
                      Add
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMed(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-600" />
              <span>Symptom Log</span>
            </CardTitle>
            <CardDescription>Track how you're feeling day by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {symptoms.map((symptom) => (
                <div key={symptom.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">{symptom.symptom_type}</h4>
                    <Badge className={getSeverityColor(symptom.severity)}>
                      {symptom.severity}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{symptom.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(symptom.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
              
              {!showAddSymptom ? (
                <Button
                  onClick={() => setShowAddSymptom(true)}
                  variant="outline"
                  className="w-full border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Symptom
                </Button>
              ) : (
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <Input
                    placeholder="Symptom type (e.g., fatigue, nausea)"
                    value={symptomForm.symptom_type}
                    onChange={(e) => setSymptomForm({...symptomForm, symptom_type: e.target.value})}
                  />
                  <div>
                    <Label>Severity: {symptomForm.severity[0]}/10</Label>
                    <Slider
                      value={symptomForm.severity}
                      onValueChange={(value) => setSymptomForm({...symptomForm, severity: value})}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <Textarea
                    placeholder="Description and notes"
                    value={symptomForm.description}
                    onChange={(e) => setSymptomForm({...symptomForm, description: e.target.value})}
                  />
                  <Input
                    placeholder="Possible triggers"
                    value={symptomForm.triggers}
                    onChange={(e) => setSymptomForm({...symptomForm, triggers: e.target.value})}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={addSymptom} className="bg-amber-500 hover:bg-amber-600">
                      Log
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddSymptom(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span>Appointments</span>
            </CardTitle>
            <CardDescription>Never miss an important appointment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-800">{apt.appointment_type}</h4>
                  <p className="text-sm text-gray-600">Dr. {apt.doctor_name}</p>
                  <p className="text-sm text-blue-600">{apt.appointment_date} at {apt.appointment_time}</p>
                  <p className="text-xs text-gray-500">{apt.location}</p>
                </div>
              ))}
              
              {!showAddAppointment ? (
                <Button
                  onClick={() => setShowAddAppointment(true)}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Appointment
                </Button>
              ) : (
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <Input
                    placeholder="Appointment type (e.g., Oncology checkup)"
                    value={appointmentForm.appointment_type}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_type: e.target.value})}
                  />
                  <Input
                    placeholder="Doctor name"
                    value={appointmentForm.doctor_name}
                    onChange={(e) => setAppointmentForm({...appointmentForm, doctor_name: e.target.value})}
                  />
                  <Input
                    placeholder="Location"
                    value={appointmentForm.location}
                    onChange={(e) => setAppointmentForm({...appointmentForm, location: e.target.value})}
                  />
                  <Input
                    type="date"
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                  />
                  <Input
                    type="time"
                    value={appointmentForm.appointment_time}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
                  />
                  <Textarea
                    placeholder="Notes"
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={addAppointment} className="bg-blue-500 hover:bg-blue-600">
                      Add
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddAppointment(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// I'll continue with the other components in the next part due to length...
// For now, let me implement the main App structure

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('companion');
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, profile

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-25 to-pink-25">
      <BrowserRouter>
        <AuthProvider>
          <AppContent 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

const AppContent = ({ activeTab, setActiveTab, currentView, setCurrentView }) => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your HopeHub...</p>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'companion':
        return <CancerCompanion />;
      case 'nutrition':
        return <div>Nutrition Helper - Coming Soon</div>; // Will implement shortly
      case 'mental':
        return <div>Mental Health Buddy - Coming Soon</div>; // Will implement shortly
      case 'resources':
        return <div>Local Resource Finder - Coming Soon</div>; // Will implement shortly
      default:
        return <CancerCompanion />;
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <div>
              <Navigation 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                user={user}
                onProfileClick={() => setCurrentView('profile')}
                onLogout={logout}
              />
              <main className="max-w-6xl mx-auto px-6 py-8">
                {currentView === 'profile' ? (
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentView('dashboard')}
                      className="mb-4"
                    >
                      ← Back to Dashboard
                    </Button>
                    <ProfilePage />
                  </div>
                ) : (
                  renderActiveTab()
                )}
              </main>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

export default App;