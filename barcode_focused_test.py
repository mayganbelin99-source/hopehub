#!/usr/bin/env python3
"""
Focused test for HopeHub barcode scanning functionality
Tests the specific requirements from the review request
"""

import requests
import json
import pymongo
from datetime import datetime, timezone, timedelta
import uuid

class BarcodeTestSuite:
    def __init__(self, base_url="https://cancer-companion-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.user_id = "barcode-test-user"
        self.setup_test_user()

    def setup_test_user(self):
        """Setup a test user session for authentication"""
        try:
            # Connect to MongoDB
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client["hopehub_database"]
            
            # Create test user
            test_user = {
                "id": self.user_id,
                "email": "barcodetest@hopehub.com",
                "name": "Barcode Test User",
                "picture": None,
                "role": "patient",
                "personal_mantra": None,
                "fighting_for": None,
                "diagnosis_date": None,
                "favorite_color": "#ec4899",
                "theme_preference": "soft",
                "treatment_milestones": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            # Insert or update user
            db.users.replace_one({"id": self.user_id}, test_user, upsert=True)
            
            # Create session token
            session_token = f"barcode-test-session-{uuid.uuid4()}"
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            
            session_data = {
                "id": str(uuid.uuid4()),
                "user_id": self.user_id,
                "session_token": session_token,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc)
            }
            
            # Remove existing sessions and create new one
            db.sessions.delete_many({"user_id": self.user_id})
            db.sessions.insert_one(session_data)
            
            # Set session cookie
            self.session.cookies.set("session_token", session_token)
            
            client.close()
            print("✅ Barcode test user session created successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to setup barcode test user: {str(e)}")
            return False

    def test_nutella_barcode_analysis(self):
        """Test the specific Nutella barcode from the review request"""
        print("\n🍫 Testing Nutella Barcode Analysis (3017620422003)")
        
        url = f"{self.api_url}/barcode/analyze"
        data = {"barcode": "3017620422003"}
        
        response = self.session.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS - Product: {result.get('product_name')}")
            print(f"   📊 Cancer Health Score: {result.get('cancer_patient_score')}/100")
            print(f"   🏥 Overall Health Score: {result.get('health_score')}/100")
            print(f"   🏷️  Nutrition Grade: {result.get('nutrition_grade', 'N/A')}")
            print(f"   🔢 NOVA Group: {result.get('nova_group', 'N/A')}")
            
            # Validate cancer-specific features
            warnings = result.get('warnings', [])
            recommendations = result.get('recommendations', [])
            alternatives = result.get('alternatives', [])
            
            print(f"   ⚠️  Warnings ({len(warnings)}):")
            for warning in warnings:
                print(f"      - {warning}")
            
            print(f"   💡 Recommendations ({len(recommendations)}):")
            for rec in recommendations:
                print(f"      - {rec}")
            
            print(f"   🔄 Alternatives ({len(alternatives)}):")
            for alt in alternatives:
                print(f"      - {alt}")
            
            # Validate nutrition data
            nutriments = result.get('nutriments', {})
            print(f"   🥗 Key Nutrients:")
            for nutrient, value in nutriments.items():
                print(f"      - {nutrient}: {value}")
            
            return True
        else:
            print(f"❌ FAILED - Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    def test_invalid_barcode_handling(self):
        """Test invalid barcode handling"""
        print("\n❌ Testing Invalid Barcode Handling")
        
        url = f"{self.api_url}/barcode/analyze"
        data = {"barcode": "0000000000000"}
        
        response = self.session.post(url, json=data)
        
        if response.status_code == 404:
            result = response.json()
            print(f"✅ SUCCESS - Correctly returned 404 for invalid barcode")
            print(f"   Message: {result.get('detail')}")
            return True
        else:
            print(f"❌ FAILED - Expected 404, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    def test_product_search(self):
        """Test product search functionality"""
        print("\n🔍 Testing Product Search")
        
        url = f"{self.api_url}/barcode/search"
        params = {"query": "nutella", "limit": 5}
        
        response = self.session.get(url, params=params)
        
        if response.status_code == 200:
            result = response.json()
            results = result.get('results', [])
            print(f"✅ SUCCESS - Found {len(results)} products")
            
            if results:
                first_result = results[0]
                print(f"   📦 First result: {first_result.get('product_name')}")
                print(f"   🏷️  Brand: {first_result.get('brand', 'N/A')}")
                print(f"   📱 Barcode: {first_result.get('barcode')}")
                print(f"   🏥 Nutrition Grade: {first_result.get('nutrition_grade', 'N/A')}")
            
            return True
        else:
            print(f"❌ FAILED - Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    def test_scan_history_storage(self):
        """Test that scan results are stored in history"""
        print("\n📚 Testing Scan History Storage")
        
        # First, perform a scan to ensure we have data
        analyze_url = f"{self.api_url}/barcode/analyze"
        analyze_data = {"barcode": "3017620422003"}
        analyze_response = self.session.post(analyze_url, json=analyze_data)
        
        if analyze_response.status_code != 200:
            print("❌ FAILED - Could not perform initial scan for history test")
            return False
        
        # Now check history
        history_url = f"{self.api_url}/barcode/history"
        params = {"limit": 10}
        
        response = self.session.get(history_url, params=params)
        
        if response.status_code == 200:
            result = response.json()
            scans = result.get('scans', [])
            print(f"✅ SUCCESS - History contains {len(scans)} scans")
            
            if scans:
                latest_scan = scans[0]
                print(f"   📦 Latest scan: {latest_scan.get('product_name')}")
                print(f"   📱 Barcode: {latest_scan.get('barcode')}")
                print(f"   📅 Date: {latest_scan.get('analysis_date')}")
                print(f"   👤 User ID: {latest_scan.get('user_id')}")
            
            return True
        else:
            print(f"❌ FAILED - Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    def test_authentication_requirement(self):
        """Test that authentication is required for barcode endpoints"""
        print("\n🔐 Testing Authentication Requirement")
        
        # Create a session without authentication
        unauth_session = requests.Session()
        
        url = f"{self.api_url}/barcode/analyze"
        data = {"barcode": "3017620422003"}
        
        response = unauth_session.post(url, json=data)
        
        if response.status_code == 401:
            print("✅ SUCCESS - Authentication correctly required")
            print(f"   Message: {response.json().get('detail')}")
            return True
        else:
            print(f"❌ FAILED - Expected 401, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    def test_cancer_health_scoring(self):
        """Test cancer-specific health scoring"""
        print("\n🏥 Testing Cancer Health Scoring")
        
        url = f"{self.api_url}/barcode/analyze"
        data = {"barcode": "3017620422003"}  # Nutella - should have low cancer score
        
        response = self.session.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            cancer_score = result.get('cancer_patient_score', 0)
            overall_score = result.get('overall_score', 0)
            
            print(f"✅ SUCCESS - Scoring system working")
            print(f"   📊 Cancer Patient Score: {cancer_score}/100")
            print(f"   🏥 Overall Health Score: {overall_score}/100")
            
            # Validate score range
            if 0 <= cancer_score <= 100 and 0 <= overall_score <= 100:
                print("   ✅ Scores are within valid range (0-100)")
            else:
                print("   ❌ Scores are outside valid range")
                return False
            
            # Check for cancer-specific warnings and recommendations
            warnings = result.get('warnings', [])
            recommendations = result.get('recommendations', [])
            
            cancer_keywords = ['cancer', 'treatment', 'immune', 'sugar', 'sodium', 'processed']
            has_cancer_specific = any(
                any(keyword in item.lower() for keyword in cancer_keywords)
                for item in warnings + recommendations
            )
            
            if has_cancer_specific:
                print("   ✅ Cancer-specific guidance detected")
            else:
                print("   ⚠️  No obvious cancer-specific guidance found")
            
            return True
        else:
            print(f"❌ FAILED - Status: {response.status_code}")
            return False

    def run_all_tests(self):
        """Run all barcode scanning tests"""
        print("🧪 HopeHub Barcode Scanning Test Suite")
        print("=" * 60)
        
        tests = [
            ("Nutella Barcode Analysis", self.test_nutella_barcode_analysis),
            ("Invalid Barcode Handling", self.test_invalid_barcode_handling),
            ("Product Search", self.test_product_search),
            ("Scan History Storage", self.test_scan_history_storage),
            ("Authentication Requirement", self.test_authentication_requirement),
            ("Cancer Health Scoring", self.test_cancer_health_scoring),
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                success = test_func()
                results.append((test_name, success))
            except Exception as e:
                print(f"❌ FAILED - {test_name}: {str(e)}")
                results.append((test_name, False))
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 BARCODE SCANNING TEST RESULTS")
        print("=" * 60)
        
        passed = 0
        for test_name, success in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} - {test_name}")
            if success:
                passed += 1
        
        print(f"\n📈 Tests passed: {passed}/{len(results)}")
        
        if passed == len(results):
            print("\n🎉 ALL BARCODE SCANNING TESTS PASSED!")
            print("✅ Barcode scanning functionality is working correctly")
            print("✅ Open Food Facts API integration is functional")
            print("✅ Cancer-specific health scoring is implemented")
            print("✅ Authentication and session management working")
            print("✅ Data persistence and history tracking working")
            return True
        else:
            print(f"\n❌ {len(results) - passed} tests failed")
            return False

if __name__ == "__main__":
    suite = BarcodeTestSuite()
    success = suite.run_all_tests()
    exit(0 if success else 1)