import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
  Coffee
} from 'lucide-react';

import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock user ID for demo
const USER_ID = 'demo-user-123';

// Navigation Component
const Navigation = ({ activeTab, setActiveTab }) => {
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
              <p className="text-sm text-gray-600">Your companion in wellness</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Today's gentle reminder:</p>
            <p className="text-sm font-medium text-rose-600">You are stronger than you know 💙</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="companion" className="flex items-center space-x-2 data-[state=active]:bg-rose-100">
              <Pill className="w-4 h-4" />
              <span>Cancer Companion</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center space-x-2 data-[state=active]:bg-pink-100">
              <Utensils className="w-4 h-4" />
              <span>Nutrition Helper</span>
            </TabsTrigger>
            <TabsTrigger value="mental" className="flex items-center space-x-2 data-[state=active]:bg-purple-100">
              <Smile className="w-4 h-4" />
              <span>Mental Health</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center space-x-2 data-[state=active]:bg-blue-100">
              <MapPin className="w-4 h-4" />
              <span>Local Resources</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
};

// Cancer Companion Component
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
      const response = await axios.get(`${API}/medications/${USER_ID}`);
      setMedications(response.data);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const fetchSymptoms = async () => {
    try {
      const response = await axios.get(`${API}/symptoms/${USER_ID}`);
      setSymptoms(response.data.slice(0, 10)); // Show last 10 symptoms
    } catch (error) {
      console.error('Error fetching symptoms:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments/${USER_ID}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const addMedication = async () => {
    try {
      const medData = {
        ...medForm,
        user_id: USER_ID,
        reminder_times: medForm.reminder_times || []
      };
      await axios.post(`${API}/medications`, medData);
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
        user_id: USER_ID,
        severity: symptomForm.severity[0]
      };
      await axios.post(`${API}/symptoms`, symptomData);
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
      const appointmentData = {
        ...appointmentForm,
        user_id: USER_ID
      };
      await axios.post(`${API}/appointments`, appointmentData);
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

// Nutrition Helper Component
const NutritionHelper = () => {
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
      const response = await axios.get(`${API}/nutrition/${USER_ID}`);
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

      const response = await axios.post(`${API}/ai/meal-suggestions`, formData);
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
        user_id: USER_ID,
        food_items: mealForm.food_items.split(',').map(item => item.trim())
      };
      await axios.post(`${API}/nutrition`, entryData);
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

      {/* Future Barcode Scanner Section */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-orange-600" />
            <span>Food Scanner</span>
          </CardTitle>
          <CardDescription>Scan barcodes to get health scores and alternatives (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-gray-600 mb-4">Barcode scanning for instant nutrition analysis</p>
            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
              Feature coming soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Mental Health Buddy Component
const MentalHealthBuddy = () => {
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
            return current === 'hold' ? 4 : 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase]);

  const fetchMoodEntries = async () => {
    try {
      const response = await axios.get(`${API}/mood/${USER_ID}`);
      setMoodEntries(response.data.slice(0, 7)); // Show last 7 entries
    } catch (error) {
      console.error('Error fetching mood entries:', error);
    }
  };

  const addMoodEntry = async () => {
    try {
      const entryData = {
        ...moodForm,
        user_id: USER_ID,
        mood_rating: moodForm.mood_rating[0],
        stress_level: moodForm.stress_level[0],
        energy_level: moodForm.energy_level[0]
      };
      await axios.post(`${API}/mood`, entryData);
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

      const response = await axios.post(`${API}/ai/calming-activity`, formData);
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

// Local Resource Finder Component
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
      
      // Show success message (you could use a toast here)
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
    <div className="min-h-screen bg-gradient-to-br from-rose-25 to-pink-25">
      <BrowserRouter>
        <Routes>
          <Route
            path="/*"
            element={
              <div>
                <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="max-w-6xl mx-auto px-6 py-8">
                  {renderActiveTab()}
                </main>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;