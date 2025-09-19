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
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
      
      if (response.data.role === 'caregiver') {
        fetchPatients();
      }
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
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
    console.log('Attempting login with session ID:', sessionId);
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      
      console.log('Sending request to:', `${API}/auth/process-session`);
      const response = await axios.post(`${API}/auth/process-session`, formData, {
        withCredentials: true
      });
      
      console.log('Response:', response.data);
      if (response.data.success) {
        setUser(response.data.user);
        console.log('User set:', response.data.user);
        return true;
      }
      console.log('No success in response');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
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
    // Check for session_id in URL fragment or query parameters
    const hash = window.location.hash;
    const search = window.location.search;
    let sessionId = null;
    
    // Check hash fragment first
    if (hash.includes('session_id=')) {
      sessionId = hash.split('session_id=')[1].split('&')[0];
    }
    // Check query parameters
    else if (search.includes('session_id=')) {
      const urlParams = new URLSearchParams(search);
      sessionId = urlParams.get('session_id');
    }
    
    if (sessionId) {
      processSessionId(sessionId);
    }
  }, []);

  const processSessionId = async (sessionId) => {
    console.log('Processing session ID:', sessionId);
    setProcessing(true);
    try {
      const success = await login(sessionId);
      console.log('Login success:', success);
      if (success) {
        // Clear the URL fragment
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/dashboard');
      } else {
        console.error('Authentication failed - no success from backend');
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
    const redirectUrl = `${window.location.origin}/login`;
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

// Barcode Scanner Component
const BarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Import ZXing scanner dynamically to handle any loading issues
  const [ZXingScanner, setZXingScanner] = useState(null);
  
  useEffect(() => {
    const loadScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        setZXingScanner(new BrowserMultiFormatReader());
      } catch (err) {
        console.error('Failed to load barcode scanner:', err);
        setError('Camera scanner not available. Please use manual input.');
      }
    };
    loadScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!ZXingScanner) {
      setError('Scanner not loaded. Please use manual input.');
      return;
    }

    try {
      setIsScanning(true);
      setError('');
      
      const devices = await ZXingScanner.listVideoInputDevices();
      if (devices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (or back camera if available)
      const selectedDevice = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      ) || devices[0];

      scannerRef.current = ZXingScanner;
      
      await ZXingScanner.decodeOnceFromVideoDevice(selectedDevice.deviceId, videoRef.current)
        .then(result => {
          if (result) {
            handleBarcodeDetected(result.getText());
          }
        })
        .catch(err => {
          if (err.name !== 'NotFoundException') {
            console.error('Scanning error:', err);
            setError('Failed to access camera. Please ensure camera permissions are granted.');
          }
        });
        
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Failed to access camera. Please use manual input or check permissions.');
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
    }
    setIsScanning(false);
  };

  const handleBarcodeDetected = async (barcode) => {
    console.log('Barcode detected:', barcode);
    stopScanning();
    await analyzeBarcode(barcode);
  };

  const analyzeBarcode = async (barcode) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/barcode/analyze`, {
        barcode: barcode.trim()
      }, { withCredentials: true });
      
      setScanResult(response.data);
    } catch (err) {
      console.error('Barcode analysis error:', err);
      if (err.response?.status === 404) {
        setError('Product not found in nutrition database. Try another product.');
      } else {
        setError('Failed to analyze barcode. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      analyzeBarcode(manualBarcode.trim());
      setShowManualInput(false);
      setManualBarcode('');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setManualBarcode('');
    setShowManualInput(false);
  };

  const getHealthScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-orange-600" />
          <span>Food Scanner</span>
        </CardTitle>
        <CardDescription>
          Scan barcodes to get health scores and cancer-friendly alternatives
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!scanResult ? (
          <div className="space-y-4">
            {/* Camera Scanner */}
            <div className="text-center">
              {!isScanning ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={startScanning}
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={!ZXingScanner}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Start Camera Scanner
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowManualInput(true)}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      Manual Input
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    className="w-full max-w-sm mx-auto rounded-lg border-2 border-orange-200"
                    style={{ maxHeight: '300px' }}
                    autoPlay
                    muted
                    playsInline
                  />
                  <p className="text-sm text-gray-600">Position barcode in the camera view</p>
                  <Button
                    onClick={stopScanning}
                    variant="outline"
                    className="border-orange-200 text-orange-600"
                  >
                    Stop Scanning
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Input Dialog */}
            {showManualInput && (
              <div className="bg-white p-4 rounded-lg border space-y-3">
                <h4 className="font-semibold">Enter Barcode Manually</h4>
                <Input
                  placeholder="Enter barcode (e.g., 3017620422003)"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <div className="flex space-x-2">
                  <Button onClick={handleManualSubmit} className="bg-orange-500 hover:bg-orange-600">
                    Analyze
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Analyzing nutrition data...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* Scan Results */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Nutrition Analysis</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={resetScanner}
                className="border-orange-200 text-orange-600"
              >
                Scan Another
              </Button>
            </div>

            {/* Product Info */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-start space-x-4">
                {scanResult.image_url && (
                  <img
                    src={scanResult.image_url}
                    alt={scanResult.product_name}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{scanResult.product_name}</h4>
                  <p className="text-sm text-gray-600">{scanResult.brand}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={`px-3 py-1 rounded-full ${getHealthScoreColor(scanResult.cancer_health_score)}`}>
                      Cancer Health Score: {scanResult.cancer_health_score}/10
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Assessment */}
            {scanResult.health_assessment && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-semibold mb-2 text-gray-800">Health Assessment</h5>
                <p className="text-sm text-gray-700">{scanResult.health_assessment}</p>
              </div>
            )}

            {/* Nutrition Facts */}
            {scanResult.nutrition_per_100g && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-semibold mb-3 text-gray-800">Nutrition Facts (per 100g)</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(scanResult.nutrition_per_100g).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-gray-800">
                        {typeof value === 'number' ? value.toFixed(1) : value}
                        {key.includes('energy') ? ' kcal' : 
                         key.includes('salt') || key.includes('sugar') || key.includes('fat') || key.includes('protein') ? 'g' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {scanResult.recommended_alternatives && scanResult.recommended_alternatives.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-semibold mb-2 text-gray-800">Cancer-Friendly Alternatives</h5>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {scanResult.recommended_alternatives.join('\n')}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Nutrition Helper Component (updated with authentication)
const NutritionHelper = () => {
  const { user } = useAuth();
  const [mealSuggestions, setMealSuggestions] = useState('');
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [nutritionEntries, setNutritionEntries] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  
  const [mealForm, setMealForm] = useState({
    meal_type: '',
    food_items: '',
    notes: ''
  });

  const [suggestionForm, setSuggestionForm] = useState({
    dietary_restrictions: '',
    energy_level: [5],
    nausea: false,
    appetite: 'normal'
  });

  useEffect(() => {
    fetchNutritionEntries();
  }, []);

  const fetchNutritionEntries = async () => {
    try {
      const response = await axios.get(`${API}/nutrition`, { withCredentials: true });
      setNutritionEntries(response.data.slice(0, 10));
    } catch (error) {
      console.error('Error fetching nutrition entries:', error);
    }
  };

  const getMealSuggestions = async () => {
    setLoadingMeals(true);
    try {
      const formData = new FormData();
      formData.append('dietary_restrictions', suggestionForm.dietary_restrictions);
      formData.append('energy_level', suggestionForm.energy_level[0]);
      formData.append('nausea', suggestionForm.nausea);
      formData.append('appetite', suggestionForm.appetite);

      const response = await axios.post(`${API}/ai/meal-suggestions`, formData, { withCredentials: true });
      setMealSuggestions(response.data.meal_suggestions);
    } catch (error) {
      console.error('Error getting meal suggestions:', error);
      setMealSuggestions('Unable to get personalized suggestions. Try: Gentle chicken broth with rice, banana smoothie with yogurt, or herbal tea with honey.');
    } finally {
      setLoadingMeals(false);
    }
  };

  const addNutritionEntry = async () => {
    try {
      const entryData = {
        ...mealForm,
        food_items: mealForm.food_items.split(',').map(item => item.trim())
      };
      await axios.post(`${API}/nutrition`, entryData, { withCredentials: true });
      setMealForm({
        meal_type: '',
        food_items: '',
        notes: ''
      });
      setShowAddEntry(false);
      fetchNutritionEntries();
    } catch (error) {
      console.error('Error adding nutrition entry:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 font-serif">Nourish Your Body</h2>
        <p className="text-gray-600">Gentle nutrition guidance tailored for your healing journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Meal Suggestions */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span>Personalized Meal Suggestions</span>
            </CardTitle>
            <CardDescription>Get gentle, nourishing meal ideas based on how you're feeling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>How's your energy level today?</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">Low</span>
                  <Slider
                    value={suggestionForm.energy_level}
                    onValueChange={(value) => setSuggestionForm({...suggestionForm, energy_level: value})}
                    max={10}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm">High</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Current: {suggestionForm.energy_level[0]}/10</p>
              </div>

              <div>
                <Label>Dietary restrictions or preferences</Label>
                <Input
                  placeholder="e.g., dairy-free, low sodium, vegetarian"
                  value={suggestionForm.dietary_restrictions}
                  onChange={(e) => setSuggestionForm({...suggestionForm, dietary_restrictions: e.target.value})}
                />
              </div>

              <div>
                <Label>How's your appetite?</Label>
                <Select value={suggestionForm.appetite} onValueChange={(value) => setSuggestionForm({...suggestionForm, appetite: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Small portions please</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Good - I'm hungry!</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nausea"
                  checked={suggestionForm.nausea}
                  onChange={(e) => setSuggestionForm({...suggestionForm, nausea: e.target.checked})}
                />
                <Label htmlFor="nausea">I'm experiencing nausea</Label>
              </div>
            </div>

            <Button 
              onClick={getMealSuggestions} 
              disabled={loadingMeals}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              {loadingMeals ? 'Getting suggestions...' : 'Get Meal Suggestions'}
            </Button>

            {mealSuggestions && (
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-700">Gentle Meal Ideas for You:</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{mealSuggestions}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Tracking */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coffee className="w-5 h-5 text-purple-600" />
              <span>Meal Journal</span>
            </CardTitle>
            <CardDescription>Keep track of what nourishes you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nutritionEntries.map((entry) => (
                <div key={entry.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 capitalize">{entry.meal_type}</h4>
                    <Badge variant="outline">{new Date(entry.timestamp).toLocaleDateString()}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{entry.food_items.join(', ')}</p>
                  {entry.notes && <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>}
                </div>
              ))}
              
              {!showAddEntry ? (
                <Button
                  onClick={() => setShowAddEntry(true)}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Meal
                </Button>
              ) : (
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <Select value={mealForm.meal_type} onValueChange={(value) => setMealForm({...mealForm, meal_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Food items (comma separated)"
                    value={mealForm.food_items}
                    onChange={(e) => setMealForm({...mealForm, food_items: e.target.value})}
                  />
                  <Textarea
                    placeholder="Notes about how it made you feel"
                    value={mealForm.notes}
                    onChange={(e) => setMealForm({...mealForm, notes: e.target.value})}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={addNutritionEntry} className="bg-purple-500 hover:bg-purple-600">
                      Log
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddEntry(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanner Section */}
      <BarcodeScanner />
    </div>
  );
};

// Mental Health Buddy Component (updated with authentication)
const MentalHealthBuddy = () => {
  const { user } = useAuth();
  const [moodEntries, setMoodEntries] = useState([]);
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [calmingActivity, setCalmingActivity] = useState('');
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('breathe in');
  const [breathingCount, setBreathingCount] = useState(4);

  const [moodForm, setMoodForm] = useState({
    mood_rating: [5],
    emotions: [],
    journal_entry: '',
    gratitude_notes: '',
    stress_level: [5],
    energy_level: [5]
  });

  const emotionOptions = [
    'Happy', 'Grateful', 'Hopeful', 'Peaceful', 'Loved', 'Anxious', 'Worried', 
    'Sad', 'Frustrated', 'Tired', 'Overwhelmed', 'Confused', 'Lonely', 'Scared'
  ];

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  useEffect(() => {
    let interval;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathingCount(prev => {
          if (prev <= 1) {
            setBreathingPhase(current => 
              current === 'breathe in' ? 'hold' : 
              current === 'hold' ? 'breathe out' : 'breathe in'
            );
            return 4; // Always return 4 for each phase
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase]);

  const fetchMoodEntries = async () => {
    try {
      const response = await axios.get(`${API}/mood`, { withCredentials: true });
      setMoodEntries(response.data.slice(0, 7));
    } catch (error) {
      console.error('Error fetching mood entries:', error);
    }
  };

  const addMoodEntry = async () => {
    try {
      const entryData = {
        ...moodForm,
        mood_rating: moodForm.mood_rating[0],
        stress_level: moodForm.stress_level[0],
        energy_level: moodForm.energy_level[0]
      };
      await axios.post(`${API}/mood`, entryData, { withCredentials: true });
      setMoodForm({
        mood_rating: [5],
        emotions: [],
        journal_entry: '',
        gratitude_notes: '',
        stress_level: [5],
        energy_level: [5]
      });
      setShowMoodForm(false);
      fetchMoodEntries();
    } catch (error) {
      console.error('Error adding mood entry:', error);
    }
  };

  const getCalmingActivity = async () => {
    setLoadingActivity(true);
    try {
      const formData = new FormData();
      formData.append('mood_level', moodForm.mood_rating[0]);
      formData.append('stress_level', moodForm.stress_level[0]);
      formData.append('energy_level', moodForm.energy_level[0]);

      const response = await axios.post(`${API}/ai/calming-activity`, formData, { withCredentials: true });
      setCalmingActivity(response.data.calming_activities);
    } catch (error) {
      console.error('Error getting calming activity:', error);
      setCalmingActivity('Take three deep breaths. Focus on your exhale, letting go of tension with each breath. You are safe in this moment.');
    } finally {
      setLoadingActivity(false);
    }
  };

  const toggleBreathing = () => {
    setBreathingActive(!breathingActive);
    if (!breathingActive) {
      setBreathingPhase('breathe in');
      setBreathingCount(4);
    }
  };

  const toggleEmotion = (emotion) => {
    setMoodForm(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion]
    }));
  };

  const getMoodColor = (mood) => {
    if (mood <= 3) return 'bg-red-100 text-red-800';
    if (mood <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 font-serif">Your Mental Wellness</h2>
        <p className="text-gray-600">A gentle space for your thoughts and feelings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Check-in */}
        <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smile className="w-5 h-5 text-pink-600" />
              <span>Daily Check-in</span>
            </CardTitle>
            <CardDescription>How are you feeling today?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moodEntries.map((entry) => (
                <div key={entry.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge className={getMoodColor(entry.mood_rating)}>
                      Mood: {entry.mood_rating}/10
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.emotions.map((emotion) => (
                      <Badge key={emotion} variant="outline" className="text-xs">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                  {entry.journal_entry && (
                    <p className="text-sm text-gray-600 mt-2">{entry.journal_entry}</p>
                  )}
                </div>
              ))}
              
              {!showMoodForm ? (
                <Button
                  onClick={() => setShowMoodForm(true)}
                  variant="outline"
                  className="w-full border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Check-in
                </Button>
              ) : (
                <div className="bg-white p-4 rounded-lg space-y-4">
                  <div>
                    <Label>Overall Mood: {moodForm.mood_rating[0]}/10</Label>
                    <Slider
                      value={moodForm.mood_rating}
                      onValueChange={(value) => setMoodForm({...moodForm, mood_rating: value})}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Stress Level: {moodForm.stress_level[0]}/10</Label>
                    <Slider
                      value={moodForm.stress_level}
                      onValueChange={(value) => setMoodForm({...moodForm, stress_level: value})}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Energy Level: {moodForm.energy_level[0]}/10</Label>
                    <Slider
                      value={moodForm.energy_level}
                      onValueChange={(value) => setMoodForm({...moodForm, energy_level: value})}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>What emotions are you feeling?</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {emotionOptions.map((emotion) => (
                        <Button
                          key={emotion}
                          variant={moodForm.emotions.includes(emotion) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleEmotion(emotion)}
                          className={moodForm.emotions.includes(emotion) 
                            ? "bg-pink-500 hover:bg-pink-600" 
                            : "border-pink-200 text-pink-600 hover:bg-pink-50"
                          }
                        >
                          {emotion}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Journal entry - what's on your mind? (optional)"
                    value={moodForm.journal_entry}
                    onChange={(e) => setMoodForm({...moodForm, journal_entry: e.target.value})}
                    className="min-h-20"
                  />

                  <Textarea
                    placeholder="Three things you're grateful for today (optional)"
                    value={moodForm.gratitude_notes}
                    onChange={(e) => setMoodForm({...moodForm, gratitude_notes: e.target.value})}
                    className="min-h-16"
                  />

                  <div className="flex space-x-2">
                    <Button onClick={addMoodEntry} className="bg-pink-500 hover:bg-pink-600">
                      Save Check-in
                    </Button>
                    <Button variant="outline" onClick={() => setShowMoodForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calming Tools */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wind className="w-5 h-5 text-blue-600" />
              <span>Calming Tools</span>
            </CardTitle>
            <CardDescription>Find peace in this moment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Breathing Exercise */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-700">Breathing Exercise</h4>
              <div className="text-center">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-1000 ${
                  breathingActive 
                    ? breathingPhase === 'breathe in' 
                      ? 'bg-blue-200 scale-110' 
                      : breathingPhase === 'hold'
                      ? 'bg-blue-300 scale-110'
                      : 'bg-blue-100 scale-90'
                    : 'bg-blue-100'
                }`}>
                  <span className="text-2xl font-bold text-blue-700">
                    {breathingActive ? breathingCount : '🫁'}
                  </span>
                </div>
                {breathingActive && (
                  <p className="text-lg text-blue-700 mb-2 capitalize">{breathingPhase}</p>
                )}
                <Button
                  onClick={toggleBreathing}
                  variant={breathingActive ? "destructive" : "default"}
                  className={breathingActive ? "" : "bg-blue-500 hover:bg-blue-600"}
                >
                  {breathingActive ? 'Stop' : 'Start Breathing Exercise'}
                </Button>
              </div>
            </div>

            {/* AI Calming Activity */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-purple-700">Personalized Calming Activity</h4>
              <Button 
                onClick={getCalmingActivity} 
                disabled={loadingActivity}
                className="w-full mb-3 bg-purple-500 hover:bg-purple-600"
              >
                {loadingActivity ? 'Finding something peaceful...' : 'Get Calming Activity'}
              </Button>
              {calmingActivity && (
                <div className="text-sm text-gray-700 p-3 bg-purple-50 rounded border-l-4 border-purple-300">
                  <div className="whitespace-pre-wrap">{calmingActivity}</div>
                </div>
              )}
            </div>

            {/* Grounding Technique */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-green-700">5-4-3-2-1 Grounding</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>5</strong> things you can see</p>
                <p><strong>4</strong> things you can touch</p>
                <p><strong>3</strong> things you can hear</p>
                <p><strong>2</strong> things you can smell</p>
                <p><strong>1</strong> thing you can taste</p>
              </div>
            </div>

            {/* Crisis Resources */}
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Need immediate support?</strong><br />
                Crisis Text Line: Text HOME to 741741<br />
                National Suicide Prevention Lifeline: 988
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Local Resource Finder Component (no auth needed)
const LocalResourceFinder = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestForm, setShowSuggestForm] = useState(false);

  const [suggestForm, setSuggestForm] = useState({
    name: '',
    category: '',
    address: '',
    phone: '',
    website: '',
    description: ''
  });

  const categories = [
    { value: 'all', label: 'All Resources' },
    { value: 'food_pantry', label: 'Food Pantries' },
    { value: 'clinic', label: 'Free Clinics' },
    { value: 'support_group', label: 'Support Groups' },
    { value: 'transportation', label: 'Transportation Help' }
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, selectedCategory, searchTerm]);

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${API}/resources`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Add some sample data for demo
      const sampleResources = [
        {
          id: '1',
          name: 'City Food Bank',
          category: 'food_pantry',
          address: '123 Main St, City, ST 12345',
          phone: '(555) 123-4567',
          description: 'Free groceries for families in need',
          hours: 'Mon-Fri 9AM-5PM'
        },
        {
          id: '2',
          name: 'Hope Community Clinic',
          category: 'clinic',
          address: '456 Oak Ave, City, ST 12345',
          phone: '(555) 987-6543',
          description: 'Free medical care and prescriptions',
          hours: 'Tue-Thu 8AM-4PM'
        },
        {
          id: '3',
          name: 'Cancer Support Circle',
          category: 'support_group',
          address: '789 Pine St, City, ST 12345',
          phone: '(555) 456-7890',
          description: 'Weekly support group for cancer patients and families',
          hours: 'Thursdays 6PM-8PM'
        }
      ];
      setResources(sampleResources);
    }
  };

  const filterResources = () => {
    let filtered = resources;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredResources(filtered);
  };

  const suggestResource = async () => {
    try {
      const formData = new FormData();
      Object.keys(suggestForm).forEach(key => {
        formData.append(key, suggestForm[key]);
      });

      await axios.post(`${API}/resources/suggest`, formData);
      
      setSuggestForm({
        name: '',
        category: '',
        address: '',
        phone: '',
        website: '',
        description: ''
      });
      setShowSuggestForm(false);
      
      alert('Thank you for suggesting a resource! It will be reviewed and added soon.');
      
      fetchResources();
    } catch (error) {
      console.error('Error suggesting resource:', error);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food_pantry':
        return <Utensils className="w-4 h-4" />;
      case 'clinic':
        return <Heart className="w-4 h-4" />;
      case 'support_group':
        return <Smile className="w-4 h-4" />;
      case 'transportation':
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'food_pantry':
        return 'bg-green-100 text-green-800';
      case 'clinic':
        return 'bg-red-100 text-red-800';
      case 'support_group':
        return 'bg-blue-100 text-blue-800';
      case 'transportation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 font-serif">Community Resources</h2>
        <p className="text-gray-600">Find support and services in your local community</p>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Search resources</Label>
              <Input
                placeholder="Search by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${getCategoryColor(resource.category)}`}>
                    {getCategoryIcon(resource.category)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <Badge variant="outline" className={getCategoryColor(resource.category)}>
                      {resource.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{resource.address}</p>
              </div>
              
              {resource.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">{resource.phone}</p>
                </div>
              )}
              
              {resource.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <a 
                    href={resource.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
              
              {resource.description && (
                <p className="text-sm text-gray-600">{resource.description}</p>
              )}
              
              {resource.hours && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">{resource.hours}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-8">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No resources found matching your criteria.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your search or suggest a new resource below.</p>
        </div>
      )}

      {/* Suggest Resource */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-green-600" />
            <span>Suggest a Resource</span>
          </CardTitle>
          <CardDescription>Help others by sharing helpful community resources</CardDescription>
        </CardHeader>
        <CardContent>
          {!showSuggestForm ? (
            <Button
              onClick={() => setShowSuggestForm(true)}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              Suggest a Community Resource
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Resource Name</Label>
                  <Input
                    placeholder="e.g., Downtown Food Bank"
                    value={suggestForm.name}
                    onChange={(e) => setSuggestForm({...suggestForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={suggestForm.category} onValueChange={(value) => setSuggestForm({...suggestForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food_pantry">Food Pantry</SelectItem>
                      <SelectItem value="clinic">Free Clinic</SelectItem>
                      <SelectItem value="support_group">Support Group</SelectItem>
                      <SelectItem value="transportation">Transportation Help</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Address</Label>
                <Input
                  placeholder="Full address"
                  value={suggestForm.address}
                  onChange={(e) => setSuggestForm({...suggestForm, address: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone (optional)</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={suggestForm.phone}
                    onChange={(e) => setSuggestForm({...suggestForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Website (optional)</Label>
                  <Input
                    placeholder="https://example.com"
                    value={suggestForm.website}
                    onChange={(e) => setSuggestForm({...suggestForm, website: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of services offered"
                  value={suggestForm.description}
                  onChange={(e) => setSuggestForm({...suggestForm, description: e.target.value})}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={suggestResource} className="bg-green-500 hover:bg-green-600">
                  Submit Suggestion
                </Button>
                <Button variant="outline" onClick={() => setShowSuggestForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon: Map View */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <span>Map View</span>
          </CardTitle>
          <CardDescription>See resources on an interactive map with directions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-gray-600 mb-4">Interactive map with directions and navigation</p>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
              Map integration coming soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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
        return <NutritionHelper />;
      case 'mental':
        return <MentalHealthBuddy />;
      case 'resources':
        return <LocalResourceFinder />;
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