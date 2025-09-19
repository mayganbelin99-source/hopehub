from fastapi import FastAPI, APIRouter, HTTPException, Form, UploadFile, File, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date, time, timedelta
from dotenv import load_dotenv
import os
import uuid
import logging
from pathlib import Path
import aiohttp
import asyncio
from cachetools import TTLCache

# Import our models and auth
from models import *
from auth import AuthService, get_current_user_dependency, get_optional_current_user, set_database, get_database

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize database dependency
set_database(db)

# Create the main app
app = FastAPI(title="HopeHub API", description="Cancer companion and wellness platform with authentication")

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Helper functions for data conversion
def prepare_for_mongo(data):
    if isinstance(data.get('appointment_date'), date):
        data['appointment_date'] = data['appointment_date'].isoformat()
    if isinstance(data.get('appointment_time'), time):
        data['appointment_time'] = data['appointment_time'].strftime('%H:%M:%S')
    return data

def parse_from_mongo(item):
    # Convert date objects back to strings for Pydantic models
    if isinstance(item.get('appointment_date'), date):
        item['appointment_date'] = item['appointment_date'].isoformat()
    if isinstance(item.get('appointment_time'), time):
        item['appointment_time'] = item['appointment_time'].strftime('%H:%M')
    return item

# Authentication Routes
@api_router.post("/auth/process-session")
async def process_session(session_id: str = Form(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    """Process session ID from Emergent Auth"""
    auth_service = AuthService(db)
    user_data = await auth_service.process_session_id(session_id)
    
    if not user_data:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    response = JSONResponse({
        "success": True,
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture")
        }
    })
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=user_data["session_token"],
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    
    return response

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Logout user"""
    auth_service = AuthService(db)
    session_token = request.cookies.get("session_token")
    if session_token:
        await auth_service.logout_user(session_token)
    
    response = JSONResponse({"success": True, "message": "Logged out successfully"})
    response.delete_cookie("session_token", path="/")
    return response

@api_router.get("/auth/me")
async def get_current_user_info(current_user: UserProfile = Depends(get_current_user_dependency)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "role": current_user.role,
        "personal_mantra": current_user.personal_mantra,
        "fighting_for": current_user.fighting_for,
        "diagnosis_date": current_user.diagnosis_date,
        "favorite_color": current_user.favorite_color,
        "theme_preference": current_user.theme_preference,
        "treatment_milestones": current_user.treatment_milestones
    }

# Profile Management Routes
@api_router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    """Update user profile"""
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Profile updated successfully"}

@api_router.post("/profile/milestone")
async def add_milestone(
    milestone: MilestoneRequest,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    """Add treatment milestone"""
    milestone_data = {
        "id": str(uuid.uuid4()),
        "title": milestone.title,
        "description": milestone.description,
        "date": milestone.date,
        "milestone_type": milestone.milestone_type,
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$push": {"treatment_milestones": milestone_data}}
    )
    
    return {"success": True, "message": "Milestone added successfully"}

@api_router.delete("/profile/milestone/{milestone_id}")
async def delete_milestone(
    milestone_id: str,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    """Delete treatment milestone"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$pull": {"treatment_milestones": {"id": milestone_id}}}
    )
    
    return {"success": True, "message": "Milestone deleted successfully"}

# Caregiver Management Routes
@api_router.post("/caregivers/invite")
async def invite_caregiver(
    invite_data: CaregiverInviteRequest,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    """Invite a caregiver"""
    # Check if already invited
    existing = await db.caregiver_invitations.find_one({
        "patient_id": current_user.id,
        "caregiver_email": invite_data.caregiver_email,
        "status": "pending"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Invitation already sent to this email")
    
    invitation = CaregiverInvitation(
        patient_id=current_user.id,
        caregiver_email=invite_data.caregiver_email,
        caregiver_name=invite_data.caregiver_name
    )
    
    await db.caregiver_invitations.insert_one(invitation.dict())
    
    # In a real app, you'd send an email here
    return {"success": True, "message": "Caregiver invitation created", "invitation_id": invitation.id}

@api_router.get("/caregivers/invitations")
async def get_caregiver_invitations(current_user: UserProfile = Depends(get_current_user_dependency)):
    """Get caregiver invitations for current user"""
    invitations = await db.caregiver_invitations.find({"patient_id": current_user.id}).to_list(length=None)
    return invitations

@api_router.get("/caregivers")
async def get_caregivers(current_user: UserProfile = Depends(get_current_user_dependency)):
    """Get active caregivers for current user"""
    # Get accepted invitations
    access_records = await db.caregiver_access.find({"patient_id": current_user.id}).to_list(length=None)
    
    caregivers = []
    for access in access_records:
        caregiver = await db.users.find_one({"id": access["caregiver_id"]})
        if caregiver:
            caregivers.append({
                "id": caregiver["id"],
                "name": caregiver["name"],
                "email": caregiver["email"],
                "picture": caregiver.get("picture"),
                "granted_at": access["granted_at"]
            })
    
    return caregivers

@api_router.delete("/caregivers/{caregiver_id}")
async def remove_caregiver(
    caregiver_id: str,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    """Remove caregiver access"""
    await db.caregiver_access.delete_one({
        "patient_id": current_user.id,
        "caregiver_id": caregiver_id
    })
    
    return {"success": True, "message": "Caregiver access removed"}

@api_router.get("/patients")
async def get_patients_for_caregiver(current_user: UserProfile = Depends(get_current_user_dependency)):
    """Get patients that current user is a caregiver for"""
    access_records = await db.caregiver_access.find({"caregiver_id": current_user.id}).to_list(length=None)
    
    patients = []
    for access in access_records:
        patient = await db.users.find_one({"id": access["patient_id"]})
        if patient:
            patients.append({
                "id": patient["id"],
                "name": patient["name"],
                "email": patient["email"],
                "picture": patient.get("picture"),
                "granted_at": access["granted_at"]
            })
    
    return patients

# Cancer Companion Routes (updated with proper authentication)
@api_router.post("/medications", response_model=MedicationEntry)
async def add_medication(
    medication: MedicationEntry,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    medication.user_id = current_user.id
    medication_dict = prepare_for_mongo(medication.dict())
    await db.medications.insert_one(medication_dict)
    return medication

@api_router.get("/medications", response_model=List[MedicationEntry])
async def get_medications(current_user: UserProfile = Depends(get_current_user_dependency)):
    medications = await db.medications.find({"user_id": current_user.id}).to_list(length=None)
    return [MedicationEntry(**parse_from_mongo(med)) for med in medications]

@api_router.post("/symptoms", response_model=SymptomEntry)
async def add_symptom(
    symptom: SymptomEntry,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    symptom.user_id = current_user.id
    symptom_dict = prepare_for_mongo(symptom.dict())
    await db.symptoms.insert_one(symptom_dict)
    return symptom

@api_router.get("/symptoms", response_model=List[SymptomEntry])
async def get_symptoms(current_user: UserProfile = Depends(get_current_user_dependency)):
    symptoms = await db.symptoms.find({"user_id": current_user.id}).sort("timestamp", -1).to_list(length=None)
    return [SymptomEntry(**parse_from_mongo(sym)) for sym in symptoms]

@api_router.post("/appointments", response_model=AppointmentEntry)
async def add_appointment(
    appointment: AppointmentEntry,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    appointment.user_id = current_user.id
    appointment_dict = prepare_for_mongo(appointment.dict())
    await db.appointments.insert_one(appointment_dict)
    return appointment

@api_router.get("/appointments", response_model=List[AppointmentEntry])
async def get_appointments(current_user: UserProfile = Depends(get_current_user_dependency)):
    appointments = await db.appointments.find({"user_id": current_user.id}).sort("appointment_date", 1).to_list(length=None)
    return [AppointmentEntry(**parse_from_mongo(apt)) for apt in appointments]

# Mental Health Buddy Routes (updated with proper authentication)
@api_router.post("/mood", response_model=MoodEntry)
async def add_mood_entry(
    mood: MoodEntry,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    mood.user_id = current_user.id
    mood_dict = prepare_for_mongo(mood.dict())
    await db.mood_entries.insert_one(mood_dict)
    return mood

@api_router.get("/mood", response_model=List[MoodEntry])
async def get_mood_entries(current_user: UserProfile = Depends(get_current_user_dependency)):
    mood_entries = await db.mood_entries.find({"user_id": current_user.id}).sort("timestamp", -1).to_list(length=None)
    return [MoodEntry(**parse_from_mongo(mood)) for mood in mood_entries]

@api_router.get("/mood/trends")
async def get_mood_trends(current_user: UserProfile = Depends(get_current_user_dependency), days: int = 30):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    mood_entries = await db.mood_entries.find({
        "user_id": current_user.id,
        "timestamp": {"$gte": start_date}
    }).sort("timestamp", 1).to_list(length=None)
    
    return {
        "mood_data": [{"date": entry["timestamp"], "mood": entry["mood_rating"]} for entry in mood_entries],
        "average_mood": sum(entry["mood_rating"] for entry in mood_entries) / len(mood_entries) if mood_entries else 0,
        "trend": "improving" if len(mood_entries) > 1 and mood_entries[-1]["mood_rating"] > mood_entries[0]["mood_rating"] else "stable"
    }

# Initialize services
nutrition_cache = TTLCache(maxsize=1000, ttl=3600)  # 1 hour cache

# Barcode Scanning and Nutrition Analysis Routes
@api_router.post("/barcode/analyze")
async def analyze_barcode(
    request: BarcodeRequest,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    """
    Analyze a food product by barcode and return comprehensive nutrition data,
    health scores, and cancer-specific recommendations.
    """
    try:
        barcode = request.barcode.strip()
        
        # Check cache first
        if barcode in nutrition_cache:
            cached_analysis = nutrition_cache[barcode]
            logger.info(f"Returning cached analysis for barcode {barcode}")
            return cached_analysis
        
        # Get nutrition data from Open Food Facts
        nutrition_data = await get_open_food_facts_data(barcode)
        
        if not nutrition_data:
            raise HTTPException(
                status_code=404, 
                detail=f"Product with barcode {barcode} not found in nutrition database"
            )
        
        # Calculate health scores
        health_scores = calculate_cancer_patient_health_score(nutrition_data)
        
        # Generate recommendations
        recommendations = generate_cancer_patient_recommendations(nutrition_data, health_scores)
        
        # Create analysis object
        analysis = NutritionAnalysis(
            barcode=barcode,
            product_name=nutrition_data.get('product_name', 'Unknown Product'),
            brand=nutrition_data.get('brands', ''),
            ingredients=nutrition_data.get('ingredients_text', ''),
            allergens=nutrition_data.get('allergens_tags', []),
            nutrition_grade=nutrition_data.get('nutrition_grades', ''),
            nova_group=nutrition_data.get('nova_group', 0),
            nutriments=parse_nutriments(nutrition_data.get('nutriments', {})),
            categories=nutrition_data.get('categories_tags', []),
            health_score=health_scores.get('overall_score', 0),
            cancer_patient_score=health_scores.get('cancer_patient_score', 0),
            recommendations=recommendations.get('recommendations', []),
            warnings=recommendations.get('warnings', []),
            alternatives=recommendations.get('alternatives', []),
            image_url=nutrition_data.get('image_url', '')
        )
        
        # Cache the analysis
        nutrition_cache[barcode] = analysis
        
        # Save to user's scan history
        analysis_dict = analysis.dict()
        analysis_dict['user_id'] = current_user.id
        await db.nutrition_scans.insert_one(analysis_dict)
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing barcode {request.barcode}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during barcode analysis")

@api_router.get("/barcode/search")
async def search_products(
    query: str,
    limit: int = 10,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    """
    Search for products by name or ingredients for manual entry fallback.
    """
    try:
        if len(query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
        
        search_results = await search_open_food_facts(query, limit)
        return {"results": search_results, "count": len(search_results)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching products with query '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail="Search service temporarily unavailable")

@api_router.get("/barcode/history")
async def get_scan_history(
    current_user: UserProfile = Depends(get_current_user_dependency),
    limit: int = 20
):
    """
    Get user's barcode scan history.
    """
    try:
        scans = await db.nutrition_scans.find(
            {"user_id": current_user.id}
        ).sort("analysis_date", -1).limit(limit).to_list(length=None)
        
        # Clean up MongoDB ObjectId fields for JSON serialization
        cleaned_scans = []
        for scan in scans:
            # Remove MongoDB ObjectId field
            if '_id' in scan:
                del scan['_id']
            cleaned_scans.append(scan)
        
        return {"scans": cleaned_scans, "count": len(cleaned_scans)}
        
    except Exception as e:
        logger.error(f"Error fetching scan history for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to fetch scan history")

# Helper functions for nutrition analysis
async def get_open_food_facts_data(barcode: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve product data from Open Food Facts API.
    """
    try:
        url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}"
        headers = {
            'User-Agent': 'HopeHub/1.0 (Cancer Patient Health App) Contact: support@hopehub.com'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    logger.warning(f"Open Food Facts API returned status {response.status} for barcode {barcode}")
                    return None
                
                data = await response.json()
                
                if data.get('status') != 1 or 'product' not in data:
                    logger.info(f"Product not found in Open Food Facts for barcode {barcode}")
                    return None
                
                return data['product']
                
    except asyncio.TimeoutError:
        logger.error(f"Timeout retrieving data for barcode {barcode}")
        return None
    except Exception as e:
        logger.error(f"Error retrieving Open Food Facts data for barcode {barcode}: {str(e)}")
        return None

async def search_open_food_facts(query: str, limit: int = 10) -> List[ProductSearchResult]:
    """
    Search Open Food Facts database by product name or ingredients.
    """
    try:
        url = "https://world.openfoodfacts.org/cgi/search.pl"
        params = {
            'search_terms': query,
            'search_simple': 1,
            'action': 'process',
            'json': 1,
            'page_size': limit
        }
        headers = {
            'User-Agent': 'HopeHub/1.0 (Cancer Patient Health App) Contact: support@hopehub.com'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status != 200:
                    return []
                
                data = await response.json()
                products = data.get('products', [])
                
                results = []
                for product in products:
                    if product.get('code') and product.get('product_name'):
                        results.append(ProductSearchResult(
                            barcode=product['code'],
                            product_name=product['product_name'],
                            brand=product.get('brands', ''),
                            image_url=product.get('image_url', ''),
                            nutrition_grade=product.get('nutrition_grades', '')
                        ))
                
                return results
                
    except Exception as e:
        logger.error(f"Error searching Open Food Facts with query '{query}': {str(e)}")
        return []

def parse_nutriments(nutriments: Dict[str, Any]) -> Dict[str, float]:
    """
    Parse and standardize nutriment data from Open Food Facts.
    """
    standardized_nutrients = {}
    
    # Map common nutrients to standardized keys
    nutrient_mapping = {
        'energy_100g': 'energy_kcal',
        'energy-kcal_100g': 'energy_kcal',
        'fat_100g': 'fat',
        'saturated-fat_100g': 'saturated_fat',
        'carbohydrates_100g': 'carbohydrates',
        'sugars_100g': 'sugars',
        'fiber_100g': 'fiber',
        'proteins_100g': 'proteins',
        'salt_100g': 'salt',
        'sodium_100g': 'sodium',
        'vitamin-c_100g': 'vitamin_c',
        'calcium_100g': 'calcium',
        'iron_100g': 'iron'
    }
    
    for off_key, standard_key in nutrient_mapping.items():
        if off_key in nutriments and nutriments[off_key] is not None:
            try:
                value = float(nutriments[off_key])
                if standard_key == 'energy_kcal' and 'energy_100g' in nutriments:
                    # Convert kJ to kcal if needed
                    value = value / 4.184 if value > 1000 else value
                standardized_nutrients[standard_key] = round(value, 2)
            except (ValueError, TypeError):
                pass
    
    return standardized_nutrients

def calculate_cancer_patient_health_score(nutrition_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Calculate health scores specifically tailored for cancer patients.
    """
    scores = {
        'overall_score': 50.0,
        'cancer_patient_score': 50.0,
        'processing_score': 50.0,
        'nutrient_density_score': 50.0,
        'additive_safety_score': 50.0
    }
    
    try:
        # NOVA group scoring (food processing level)
        nova_group = nutrition_data.get('nova_group', 1)
        if nova_group == 1:  # Unprocessed
            scores['processing_score'] = 100.0
        elif nova_group == 2:  # Processed culinary ingredients
            scores['processing_score'] = 80.0
        elif nova_group == 3:  # Processed foods
            scores['processing_score'] = 50.0
        else:  # Ultra-processed foods
            scores['processing_score'] = 20.0
        
        # Nutrient density scoring
        nutriments = parse_nutriments(nutrition_data.get('nutriments', {}))
        energy_kcal = nutriments.get('energy_kcal', 100)
        
        if energy_kcal > 0:
            # Calculate beneficial nutrients per 100 kcal
            fiber = nutriments.get('fiber', 0)
            proteins = nutriments.get('proteins', 0)
            vitamin_c = nutriments.get('vitamin_c', 0)
            
            nutrient_density = ((fiber * 5) + (proteins * 2) + (vitamin_c * 1)) / energy_kcal * 100
            scores['nutrient_density_score'] = min(nutrient_density * 10, 100.0)
        
        # Additive safety scoring
        ingredients = nutrition_data.get('ingredients_text', '').lower()
        harmful_additives = [
            'sodium nitrite', 'sodium nitrate', 'bha', 'bht',
            'artificial colors', 'red dye', 'yellow dye',
            'aspartame', 'high fructose corn syrup'
        ]
        
        additive_penalties = sum(20 for additive in harmful_additives if additive in ingredients)
        scores['additive_safety_score'] = max(100.0 - additive_penalties, 0.0)
        
        # Cancer-specific considerations
        cancer_beneficial_factors = 0
        
        # High fiber content (good for cancer patients)
        if nutriments.get('fiber', 0) > 5:
            cancer_beneficial_factors += 20
        elif nutriments.get('fiber', 0) > 3:
            cancer_beneficial_factors += 10
        
        # Low sugar content (important during treatment)
        sugars = nutriments.get('sugars', 0)
        if sugars < 5:
            cancer_beneficial_factors += 15
        elif sugars > 20:
            cancer_beneficial_factors -= 15
        
        # Low sodium (reduces treatment side effects)
        sodium = nutriments.get('sodium', 0)
        if sodium < 200:
            cancer_beneficial_factors += 10
        elif sodium > 600:
            cancer_beneficial_factors -= 10
        
        # Categories that are beneficial for cancer patients
        categories = nutrition_data.get('categories_tags', [])
        beneficial_categories = [
            'vegetables', 'fruits', 'whole-grains',
            'legumes', 'nuts', 'seeds'
        ]
        
        for category in categories:
            if any(beneficial in category.lower() for beneficial in beneficial_categories):
                cancer_beneficial_factors += 15
                break
        
        scores['cancer_patient_score'] = max(min(scores['processing_score'] + cancer_beneficial_factors, 100.0), 0.0)
        
        # Overall score weighted for cancer patients
        scores['overall_score'] = (
            scores['processing_score'] * 0.3 +
            scores['nutrient_density_score'] * 0.3 +
            scores['additive_safety_score'] * 0.2 +
            scores['cancer_patient_score'] * 0.2
        )
        
    except Exception as e:
        logger.error(f"Error calculating health scores: {str(e)}")
    
    return scores

def generate_cancer_patient_recommendations(nutrition_data: Dict[str, Any], health_scores: Dict[str, float]) -> Dict[str, List[str]]:
    """
    Generate specific recommendations and warnings for cancer patients.
    """
    recommendations = []
    warnings = []
    alternatives = []
    
    try:
        overall_score = health_scores.get('overall_score', 50)
        processing_score = health_scores.get('processing_score', 50)
        nutriments = parse_nutriments(nutrition_data.get('nutriments', {}))
        
        # Processing level recommendations
        if processing_score < 40:
            warnings.append("This is a highly processed food. Cancer patients benefit from minimally processed foods.")
            recommendations.append("Look for whole food alternatives with fewer ingredients.")
            alternatives.extend([
                "Fresh fruits and vegetables",
                "Whole grains like brown rice or quinoa",
                "Lean proteins like fish or poultry"
            ])
        elif processing_score > 80:
            recommendations.append("Excellent choice! This is a minimally processed food ideal for cancer patients.")
        
        # Sugar content analysis
        sugars = nutriments.get('sugars', 0)
        if sugars > 15:
            warnings.append("High sugar content may impact immune function during treatment.")
            recommendations.append("Consider lower-sugar alternatives to support stable blood sugar.")
            alternatives.extend([
                "Fresh fruit instead of fruit juice",
                "Plain yogurt with fresh berries",
                "Nuts or seeds for snacking"
            ])
        
        # Sodium content analysis
        sodium = nutriments.get('sodium', 0)
        if sodium > 400:
            warnings.append("High sodium content may contribute to treatment-related side effects.")
            recommendations.append("Look for low-sodium versions to reduce treatment side effects.")
            alternatives.extend([
                "Fresh herbs and spices for flavoring",
                "Low-sodium or no-salt-added versions",
                "Home-prepared meals with controlled salt"
            ])
        
        # Fiber content recommendations
        fiber = nutriments.get('fiber', 0)
        if fiber > 5:
            recommendations.append("Excellent fiber content! This supports digestive health during treatment.")
        elif fiber < 2:
            recommendations.append("Consider pairing with high-fiber foods like vegetables or whole grains.")
        
        # Protein content for recovery
        proteins = nutriments.get('proteins', 0)
        if proteins > 10:
            recommendations.append("Good protein content to support recovery and maintain strength.")
        elif proteins < 5:
            recommendations.append("Consider adding protein sources to support muscle maintenance.")
            alternatives.extend([
                "Greek yogurt",
                "Lean meats or fish",
                "Beans and legumes",
                "Eggs or egg whites"
            ])
        
        # Overall assessment
        if overall_score >= 80:
            recommendations.append("Excellent choice for cancer patients - nutrient-dense and minimally processed.")
        elif overall_score >= 60:
            recommendations.append("Good option with beneficial nutrients. Consider as part of a balanced diet.")
        elif overall_score >= 40:
            recommendations.append("Moderate choice - best consumed occasionally while prioritizing whole foods.")
        else:
            warnings.append("Not recommended for regular consumption during cancer treatment.")
            recommendations.append("Focus on whole, minimally processed foods for optimal nutrition.")
        
        # Remove duplicates and limit lists
        recommendations = list(dict.fromkeys(recommendations))[:5]
        warnings = list(dict.fromkeys(warnings))[:3]
        alternatives = list(dict.fromkeys(alternatives))[:5]
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        recommendations = ["Unable to generate specific recommendations. Consult with your healthcare team about dietary choices."]
    
    return {
        'recommendations': recommendations,
        'warnings': warnings,
        'alternatives': alternatives
    }

# AI Integration for Meal Suggestions (updated with proper authentication)
@api_router.post("/ai/calming-activity")
async def get_calming_activity(
    mood_level: int = Form(...), 
    stress_level: int = Form(...),
    energy_level: int = Form(...),
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    try:
        import subprocess
        import sys
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "emergentintegrations", "--extra-index-url", "https://d33sy5i8bnduwe.cloudfront.net/simple/"])
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"calming_{uuid.uuid4()}",
            system_message=f"You are a gentle, empathetic wellness assistant for {current_user.name}, a cancer patient. Provide calming, supportive activities and gentle encouragement. Keep responses warm, hopeful, and practical."
        ).with_model("openai", "gpt-5")
        
        user_message = UserMessage(
            text=f"I'm a cancer patient feeling stressed. My mood is {mood_level}/10, stress level is {stress_level}/10, and energy level is {energy_level}/10. Please suggest 3 calming activities appropriate for my current state. Be gentle, encouraging, and focus on activities that don't require much energy if my levels are low."
        )
        
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "calming_activities": response,
            "personalized": True
        }
        
    except Exception as e:
        logger.error(f"Error getting calming activity: {str(e)}")
        fallback_activities = [
            "Take 5 deep, slow breaths focusing on your exhale",
            "Listen to gentle music or nature sounds for 10 minutes",
            "Practice gentle stretching or light movement"
        ]
        return {
            "success": False,
            "calming_activities": fallback_activities,
            "personalized": False,
            "message": "Using general recommendations"
        }

@api_router.post("/ai/meal-suggestions")
async def get_meal_suggestions(
    dietary_restrictions: str = Form(""),
    energy_level: int = Form(...),
    nausea: bool = Form(False),
    appetite: str = Form("normal"),
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    try:
        import subprocess
        import sys
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "emergentintegrations", "--extra-index-url", "https://d33sy5i8bnduwe.cloudfront.net/simple/"])
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"nutrition_{uuid.uuid4()}",
            system_message=f"You are a compassionate nutrition assistant for {current_user.name}, a cancer patient. Provide gentle, nourishing meal suggestions that are easy to prepare and digest. Focus on cancer-fighting foods and consider treatment side effects like nausea and fatigue."
        ).with_model("openai", "gpt-5")
        
        conditions_text = f"energy level is {energy_level}/10"
        if nausea:
            conditions_text += ", experiencing nausea"
        if dietary_restrictions:
            conditions_text += f", dietary restrictions: {dietary_restrictions}"
        conditions_text += f", appetite is {appetite}"
        
        user_message = UserMessage(
            text=f"I'm a cancer patient needing meal suggestions. My {conditions_text}. Please suggest 3 easy-to-prepare, nutritious meals (5 ingredients or less) that would be good for someone in my situation. Focus on cancer-fighting foods that are gentle on the stomach."
        )
        
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "meal_suggestions": response,
            "personalized": True
        }
        
    except Exception as e:
        logger.error(f"Error getting meal suggestions: {str(e)}")
        fallback_meals = [
            "Gentle ginger tea with honey and crackers",
            "Simple chicken broth with rice",
            "Banana smoothie with yogurt and honey"
        ]
        return {
            "success": False,
            "meal_suggestions": fallback_meals,
            "personalized": False,
            "message": "Using general recommendations"
        }

# Nutrition Helper Routes (updated with proper authentication)
@api_router.post("/nutrition", response_model=NutritionEntry)
async def add_nutrition_entry(
    nutrition: NutritionEntry,
    current_user: UserProfile = Depends(get_current_user_dependency)
):
    nutrition.user_id = current_user.id
    nutrition_dict = prepare_for_mongo(nutrition.dict())
    await db.nutrition_entries.insert_one(nutrition_dict)
    return nutrition

@api_router.get("/nutrition", response_model=List[NutritionEntry])
async def get_nutrition_entries(current_user: UserProfile = Depends(get_current_user_dependency)):
    entries = await db.nutrition_entries.find({"user_id": current_user.id}).sort("timestamp", -1).to_list(length=None)
    return [NutritionEntry(**parse_from_mongo(entry)) for entry in entries]

# Local Resource Finder Routes (no auth required)
@api_router.get("/resources", response_model=List[LocalResource])
async def get_local_resources(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    resources = await db.local_resources.find(query).to_list(length=None)
    return [LocalResource(**parse_from_mongo(resource)) for resource in resources]

@api_router.post("/resources", response_model=LocalResource)
async def add_local_resource(resource: LocalResource):
    resource_dict = prepare_for_mongo(resource.dict())
    await db.local_resources.insert_one(resource_dict)
    return resource

@api_router.post("/resources/suggest")
async def suggest_resource(
    name: str = Form(...),
    category: str = Form(...),
    address: str = Form(...),
    phone: str = Form(""),
    website: str = Form(""),
    description: str = Form("")
):
    new_resource = LocalResource(
        name=name,
        category=category,
        address=address,
        phone=phone if phone else None,
        website=website if website else None,
        description=description if description else None,
        services=[]
    )
    
    resource_dict = prepare_for_mongo(new_resource.dict())
    await db.local_resources.insert_one(resource_dict)
    
    return {"success": True, "message": "Resource suggestion submitted successfully"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "HopeHub API"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()