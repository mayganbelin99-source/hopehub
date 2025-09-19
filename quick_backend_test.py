#!/usr/bin/env python3
import requests
import json
import sys
from datetime import datetime

class QuickHopeHubTester:
    def __init__(self):
        self.base_url = "https://hopehub-support.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.user_id = "test-user-123"
        self.passed = 0
        self.failed = 0

    def test(self, name, method, endpoint, data=None, expected_status=200, timeout=10):
        """Quick test with timeout"""
        url = f"{self.api_url}/{endpoint}"
        print(f"Testing {name}...", end=" ")
        
        try:
            if method == 'GET':
                response = requests.get(url, timeout=timeout)
            elif method == 'POST':
                if isinstance(data, dict) and any(key in str(data) for key in ['dietary_restrictions', 'mood_level']):
                    # AI endpoints need form data
                    response = requests.post(url, data=data, timeout=timeout)
                else:
                    response = requests.post(url, json=data, timeout=timeout)
            
            if response.status_code == expected_status:
                print("✅ PASS")
                self.passed += 1
                return True, response.json() if response.status_code < 400 else {}
            else:
                print(f"❌ FAIL ({response.status_code})")
                self.failed += 1
                return False, {}
                
        except requests.exceptions.Timeout:
            print("❌ TIMEOUT")
            self.failed += 1
            return False, {}
        except Exception as e:
            print(f"❌ ERROR: {str(e)[:50]}")
            self.failed += 1
            return False, {}

    def run_all_tests(self):
        print("🏥 HopeHub Quick API Test")
        print("=" * 40)
        
        # 1. Health check
        self.test("Health Check", "GET", "health")
        
        # 2. Medication CRUD
        med_data = {
            "user_id": self.user_id,
            "medication_name": "Test Med",
            "dosage": "10mg",
            "frequency": "daily",
            "instructions": "with food",
            "start_date": "2024-01-01",
            "reminder_times": ["08:00"]
        }
        self.test("Add Medication", "POST", "medications", med_data)
        self.test("Get Medications", "GET", f"medications/{self.user_id}")
        
        # 3. Symptom CRUD
        symptom_data = {
            "user_id": self.user_id,
            "symptom_type": "fatigue",
            "severity": 5,
            "description": "tired",
            "triggers": "treatment"
        }
        self.test("Add Symptom", "POST", "symptoms", symptom_data)
        self.test("Get Symptoms", "GET", f"symptoms/{self.user_id}")
        
        # 4. Appointment CRUD
        apt_data = {
            "user_id": self.user_id,
            "appointment_type": "checkup",
            "doctor_name": "Dr. Test",
            "location": "clinic",
            "appointment_date": "2024-02-15",
            "appointment_time": "10:30",
            "notes": "routine"
        }
        self.test("Add Appointment", "POST", "appointments", apt_data)
        self.test("Get Appointments", "GET", f"appointments/{self.user_id}")
        
        # 5. Mood CRUD
        mood_data = {
            "user_id": self.user_id,
            "mood_rating": 7,
            "emotions": ["happy"],
            "journal_entry": "good day",
            "gratitude_notes": "grateful",
            "stress_level": 3,
            "energy_level": 6
        }
        self.test("Add Mood Entry", "POST", "mood", mood_data)
        self.test("Get Mood Entries", "GET", f"mood/{self.user_id}")
        
        # 6. Nutrition CRUD
        nutrition_data = {
            "user_id": self.user_id,
            "meal_type": "breakfast",
            "food_items": ["oatmeal", "banana"],
            "notes": "good"
        }
        self.test("Add Nutrition", "POST", "nutrition", nutrition_data)
        self.test("Get Nutrition", "GET", f"nutrition/{self.user_id}")
        
        # 7. Resources
        self.test("Get Resources", "GET", "resources")
        
        # 8. AI Endpoints (Critical - with longer timeout)
        print("\n🤖 Testing AI Integrations (Critical):")
        
        meal_ai_data = {
            "dietary_restrictions": "none",
            "energy_level": "5",
            "nausea": "false",
            "appetite": "normal"
        }
        success, response = self.test("AI Meal Suggestions", "POST", "ai/meal-suggestions", meal_ai_data, timeout=30)
        if success and response.get('meal_suggestions'):
            print(f"   ✨ AI meal response: {len(str(response['meal_suggestions']))} chars")
        
        calming_ai_data = {
            "mood_level": "5",
            "stress_level": "6",
            "energy_level": "4"
        }
        success, response = self.test("AI Calming Activity", "POST", "ai/calming-activity", calming_ai_data, timeout=30)
        if success and response.get('calming_activities'):
            print(f"   ✨ AI calming response: {len(str(response['calming_activities']))} chars")
        
        # Results
        print("\n" + "=" * 40)
        print(f"📊 Results: {self.passed} passed, {self.failed} failed")
        
        if self.failed > 0:
            print("❌ Some tests failed - check backend logs")
            return 1
        else:
            print("✅ All backend tests passed!")
            return 0

if __name__ == "__main__":
    tester = QuickHopeHubTester()
    sys.exit(tester.run_all_tests())