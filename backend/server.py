from fastapi import FastAPI, APIRouter, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date, time
from dotenv import load_dotenv
import os
import uuid
import logging
from pathlib import Path
import json

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="HopeHub API", description="Cancer companion and wellness platform")

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Models
class MedicationEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    medication_name: str
    dosage: str
    frequency: str
    instructions: str
    start_date: str
    end_date: Optional[str] = None
    reminder_times: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SymptomEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symptom_type: str
    severity: int  # 1-10 scale
    description: str
    triggers: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    appointment_type: str
    doctor_name: str
    location: str
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood_rating: int  # 1-10 scale
    emotions: List[str]
    journal_entry: Optional[str] = None
    gratitude_notes: Optional[str] = None
    stress_level: int  # 1-10 scale
    energy_level: int  # 1-10 scale
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocalResource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # food_pantry, clinic, support_group, transportation
    address: str
    phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    services: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NutritionEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    meal_type: str  # breakfast, lunch, dinner, snack
    food_items: List[str]
    barcode: Optional[str] = None
    nutrition_score: Optional[float] = None
    calories: Optional[int] = None
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions for data conversion
def prepare_for_mongo(data):
    if isinstance(data.get('appointment_date'), date):
        data['appointment_date'] = data['appointment_date'].isoformat()
    if isinstance(data.get('appointment_time'), time):
        data['appointment_time'] = data['appointment_time'].strftime('%H:%M:%S')
    return data

def parse_from_mongo(item):
    # Keep appointment_date and appointment_time as strings for Pydantic models
    if isinstance(item.get('appointment_date'), date):
        item['appointment_date'] = item['appointment_date'].isoformat()
    if isinstance(item.get('appointment_time'), time):
        item['appointment_time'] = item['appointment_time'].strftime('%H:%M')
    return item

# Cancer Companion Routes
@api_router.post("/medications", response_model=MedicationEntry)
async def add_medication(medication: MedicationEntry):
    medication_dict = prepare_for_mongo(medication.dict())
    await db.medications.insert_one(medication_dict)
    return medication

@api_router.get("/medications/{user_id}", response_model=List[MedicationEntry])
async def get_medications(user_id: str):
    medications = await db.medications.find({"user_id": user_id}).to_list(length=None)
    return [MedicationEntry(**parse_from_mongo(med)) for med in medications]

@api_router.post("/symptoms", response_model=SymptomEntry)
async def add_symptom(symptom: SymptomEntry):
    symptom_dict = prepare_for_mongo(symptom.dict())
    await db.symptoms.insert_one(symptom_dict)
    return symptom

@api_router.get("/symptoms/{user_id}", response_model=List[SymptomEntry])
async def get_symptoms(user_id: str):
    symptoms = await db.symptoms.find({"user_id": user_id}).sort("timestamp", -1).to_list(length=None)
    return [SymptomEntry(**parse_from_mongo(sym)) for sym in symptoms]

@api_router.post("/appointments", response_model=AppointmentEntry)
async def add_appointment(appointment: AppointmentEntry):
    appointment_dict = prepare_for_mongo(appointment.dict())
    await db.appointments.insert_one(appointment_dict)
    return appointment

@api_router.get("/appointments/{user_id}", response_model=List[AppointmentEntry])
async def get_appointments(user_id: str):
    appointments = await db.appointments.find({"user_id": user_id}).sort("appointment_date", 1).to_list(length=None)
    return [AppointmentEntry(**parse_from_mongo(apt)) for apt in appointments]

# Mental Health Buddy Routes
@api_router.post("/mood", response_model=MoodEntry)
async def add_mood_entry(mood: MoodEntry):
    mood_dict = prepare_for_mongo(mood.dict())
    await db.mood_entries.insert_one(mood_dict)
    return mood

@api_router.get("/mood/{user_id}", response_model=List[MoodEntry])
async def get_mood_entries(user_id: str):
    mood_entries = await db.mood_entries.find({"user_id": user_id}).sort("timestamp", -1).to_list(length=None)
    return [MoodEntry(**parse_from_mongo(mood)) for mood in mood_entries]

@api_router.get("/mood/trends/{user_id}")
async def get_mood_trends(user_id: str, days: int = 30):
    from datetime import timedelta
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    mood_entries = await db.mood_entries.find({
        "user_id": user_id,
        "timestamp": {"$gte": start_date}
    }).sort("timestamp", 1).to_list(length=None)
    
    return {
        "mood_data": [{"date": entry["timestamp"], "mood": entry["mood_rating"]} for entry in mood_entries],
        "average_mood": sum(entry["mood_rating"] for entry in mood_entries) / len(mood_entries) if mood_entries else 0,
        "trend": "improving" if len(mood_entries) > 1 and mood_entries[-1]["mood_rating"] > mood_entries[0]["mood_rating"] else "stable"
    }

# AI Integration for Calming Activities
@api_router.post("/ai/calming-activity")
async def get_calming_activity(
    mood_level: int = Form(...), 
    stress_level: int = Form(...),
    energy_level: int = Form(...)
):
    try:
        # Install emergentintegrations if not already installed
        import subprocess
        import sys
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "emergentintegrations", "--extra-index-url", "https://d33sy5i8bnduwe.cloudfront.net/simple/"])
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get Emergent LLM key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Create AI chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=f"calming_{uuid.uuid4()}",
            system_message="You are a gentle, empathetic wellness assistant for cancer patients. Provide calming, supportive activities and gentle encouragement. Keep responses warm, hopeful, and practical."
        ).with_model("openai", "gpt-5")
        
        # Create personalized prompt
        user_message = UserMessage(
            text=f"I'm a cancer patient feeling stressed. My mood is {mood_level}/10, stress level is {stress_level}/10, and energy level is {energy_level}/10. Please suggest 3 calming activities appropriate for my current state. Be gentle, encouraging, and focus on activities that don't require much energy if my levels are low."
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "calming_activities": response,
            "personalized": True
        }
        
    except Exception as e:
        logger.error(f"Error getting calming activity: {str(e)}")
        # Fallback activities
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

# AI Integration for Meal Suggestions
@api_router.post("/ai/meal-suggestions")
async def get_meal_suggestions(
    dietary_restrictions: str = Form(""),
    energy_level: int = Form(...),
    nausea: bool = Form(False),
    appetite: str = Form("normal")  # low, normal, high
):
    try:
        # Install emergentintegrations if not already installed
        import subprocess
        import sys
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "emergentintegrations", "--extra-index-url", "https://d33sy5i8bnduwe.cloudfront.net/simple/"])
            from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get Emergent LLM key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Create AI chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=f"nutrition_{uuid.uuid4()}",
            system_message="You are a compassionate nutrition assistant for cancer patients. Provide gentle, nourishing meal suggestions that are easy to prepare and digest. Focus on cancer-fighting foods and consider treatment side effects like nausea and fatigue."
        ).with_model("openai", "gpt-5")
        
        # Create personalized prompt
        conditions_text = f"energy level is {energy_level}/10"
        if nausea:
            conditions_text += ", experiencing nausea"
        if dietary_restrictions:
            conditions_text += f", dietary restrictions: {dietary_restrictions}"
        conditions_text += f", appetite is {appetite}"
        
        user_message = UserMessage(
            text=f"I'm a cancer patient needing meal suggestions. My {conditions_text}. Please suggest 3 easy-to-prepare, nutritious meals (5 ingredients or less) that would be good for someone in my situation. Focus on cancer-fighting foods that are gentle on the stomach."
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        return {
            "success": True,
            "meal_suggestions": response,
            "personalized": True
        }
        
    except Exception as e:
        logger.error(f"Error getting meal suggestions: {str(e)}")
        # Fallback suggestions
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

# Nutrition Helper Routes
@api_router.post("/nutrition", response_model=NutritionEntry)
async def add_nutrition_entry(nutrition: NutritionEntry):
    nutrition_dict = prepare_for_mongo(nutrition.dict())
    await db.nutrition_entries.insert_one(nutrition_dict)
    return nutrition

@api_router.get("/nutrition/{user_id}", response_model=List[NutritionEntry])
async def get_nutrition_entries(user_id: str):
    entries = await db.nutrition_entries.find({"user_id": user_id}).sort("timestamp", -1).to_list(length=None)
    return [NutritionEntry(**parse_from_mongo(entry)) for entry in entries]

# Local Resource Finder Routes
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
    # In a real app, this might go through moderation
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