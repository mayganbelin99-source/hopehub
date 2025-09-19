import requests
import sys
import json
from datetime import datetime
import time

class HopeHubAPITester:
    def __init__(self, base_url="https://hopehub-support.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = "test-user-123"

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.status_code < 400 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_medication_crud(self):
        """Test medication CRUD operations"""
        print("\n📋 Testing Medication Management...")
        
        # Test adding medication
        med_data = {
            "user_id": self.user_id,
            "medication_name": "Test Medicine",
            "dosage": "10mg",
            "frequency": "twice daily",
            "instructions": "Take with food",
            "start_date": "2024-01-01",
            "reminder_times": ["08:00", "20:00"]
        }
        
        success, response = self.run_test("Add Medication", "POST", "medications", 200, med_data)
        if not success:
            return False
            
        # Test getting medications
        success, medications = self.run_test("Get Medications", "GET", "medications", 200)
        return success

    def test_symptom_crud(self):
        """Test symptom CRUD operations"""
        print("\n🩺 Testing Symptom Logging...")
        
        # Test adding symptom
        symptom_data = {
            "user_id": self.user_id,
            "symptom_type": "fatigue",
            "severity": 6,
            "description": "Feeling tired after treatment",
            "triggers": "chemotherapy session"
        }
        
        success, response = self.run_test("Add Symptom", "POST", "symptoms", 200, symptom_data)
        if not success:
            return False
            
        # Test getting symptoms
        success, symptoms = self.run_test("Get Symptoms", "GET", "symptoms", 200)
        return success

    def test_appointment_crud(self):
        """Test appointment CRUD operations"""
        print("\n📅 Testing Appointment Management...")
        
        # Test adding appointment
        appointment_data = {
            "user_id": self.user_id,
            "appointment_type": "Oncology Checkup",
            "doctor_name": "Dr. Smith",
            "location": "Cancer Center",
            "appointment_date": "2024-02-15",
            "appointment_time": "10:30",
            "notes": "Follow-up appointment"
        }
        
        success, response = self.run_test("Add Appointment", "POST", "appointments", 200, appointment_data)
        if not success:
            return False
            
        # Test getting appointments
        success, appointments = self.run_test("Get Appointments", "GET", "appointments", 200)
        return success

    def test_mood_crud(self):
        """Test mood tracking CRUD operations"""
        print("\n😊 Testing Mood Tracking...")
        
        # Test adding mood entry
        mood_data = {
            "user_id": self.user_id,
            "mood_rating": 7,
            "emotions": ["hopeful", "grateful"],
            "journal_entry": "Had a good day today",
            "gratitude_notes": "Grateful for family support",
            "stress_level": 4,
            "energy_level": 6
        }
        
        success, response = self.run_test("Add Mood Entry", "POST", "mood", 200, mood_data)
        if not success:
            return False
            
        # Test getting mood entries
        success, mood_entries = self.run_test("Get Mood Entries", "GET", f"mood/{self.user_id}", 200)
        if not success:
            return False
            
        # Test mood trends
        success, trends = self.run_test("Get Mood Trends", "GET", f"mood/trends/{self.user_id}?days=30", 200)
        return success

    def test_nutrition_crud(self):
        """Test nutrition tracking CRUD operations"""
        print("\n🍎 Testing Nutrition Tracking...")
        
        # Test adding nutrition entry
        nutrition_data = {
            "user_id": self.user_id,
            "meal_type": "breakfast",
            "food_items": ["oatmeal", "banana", "honey"],
            "notes": "Easy to digest, felt good"
        }
        
        success, response = self.run_test("Add Nutrition Entry", "POST", "nutrition", 200, nutrition_data)
        if not success:
            return False
            
        # Test getting nutrition entries
        success, entries = self.run_test("Get Nutrition Entries", "GET", f"nutrition/{self.user_id}", 200)
        return success

    def test_resources_crud(self):
        """Test local resources CRUD operations"""
        print("\n🏥 Testing Local Resources...")
        
        # Test getting resources
        success, resources = self.run_test("Get All Resources", "GET", "resources", 200)
        if not success:
            return False
            
        # Test getting resources by category
        success, filtered = self.run_test("Get Food Pantry Resources", "GET", "resources?category=food_pantry", 200)
        if not success:
            return False
            
        # Test suggesting a resource
        suggest_data = {
            "name": "Test Community Center",
            "category": "support_group",
            "address": "123 Test St, Test City, TS 12345",
            "phone": "(555) 123-4567",
            "website": "https://test.com",
            "description": "Test support group for testing"
        }
        
        success, response = self.run_test("Suggest Resource", "POST", "resources/suggest", 200, suggest_data, files=True)
        return success

    def test_ai_meal_suggestions(self):
        """Test AI meal suggestions endpoint (CRITICAL)"""
        print("\n🤖 Testing AI Meal Suggestions (CRITICAL)...")
        
        # Test AI meal suggestions
        meal_data = {
            "dietary_restrictions": "dairy-free",
            "energy_level": 5,
            "nausea": True,
            "appetite": "low"
        }
        
        print("   ⏳ This may take a few seconds for AI response...")
        success, response = self.run_test("AI Meal Suggestions", "POST", "ai/meal-suggestions", 200, meal_data, files=True)
        
        if success and response:
            print(f"   🎯 AI Response received: {len(str(response.get('meal_suggestions', '')))} characters")
            if response.get('personalized'):
                print("   ✨ Response is personalized")
            else:
                print("   ⚠️  Using fallback suggestions")
        
        return success

    def test_ai_calming_activity(self):
        """Test AI calming activity endpoint (CRITICAL)"""
        print("\n🧘 Testing AI Calming Activity (CRITICAL)...")
        
        # Test AI calming activity
        calming_data = {
            "mood_level": 4,
            "stress_level": 8,
            "energy_level": 3
        }
        
        print("   ⏳ This may take a few seconds for AI response...")
        success, response = self.run_test("AI Calming Activity", "POST", "ai/calming-activity", 200, calming_data, files=True)
        
        if success and response:
            print(f"   🎯 AI Response received: {len(str(response.get('calming_activities', '')))} characters")
            if response.get('personalized'):
                print("   ✨ Response is personalized")
            else:
                print("   ⚠️  Using fallback activities")
        
        return success

def main():
    print("🏥 HopeHub API Testing Suite")
    print("=" * 50)
    
    tester = HopeHubAPITester()
    
    # Run all tests
    test_results = []
    
    # Basic health check
    success = tester.test_health_check()
    test_results.append(("Health Check", success))
    
    # Core CRUD operations
    success = tester.test_medication_crud()
    test_results.append(("Medication CRUD", success))
    
    success = tester.test_symptom_crud()
    test_results.append(("Symptom CRUD", success))
    
    success = tester.test_appointment_crud()
    test_results.append(("Appointment CRUD", success))
    
    success = tester.test_mood_crud()
    test_results.append(("Mood CRUD", success))
    
    success = tester.test_nutrition_crud()
    test_results.append(("Nutrition CRUD", success))
    
    success = tester.test_resources_crud()
    test_results.append(("Resources CRUD", success))
    
    # Critical AI integrations
    success = tester.test_ai_meal_suggestions()
    test_results.append(("AI Meal Suggestions", success))
    
    success = tester.test_ai_calming_activity()
    test_results.append(("AI Calming Activity", success))
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 FINAL TEST RESULTS")
    print("=" * 50)
    
    failed_tests = []
    for test_name, success in test_results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if not success:
            failed_tests.append(test_name)
    
    print(f"\n📈 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for test in failed_tests:
            print(f"   - {test}")
        return 1
    else:
        print("\n🎉 ALL TESTS PASSED!")
        return 0

if __name__ == "__main__":
    sys.exit(main())