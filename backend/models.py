from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

# User and Authentication Models
class UserRole(str, Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    
    # Profile customization
    personal_mantra: Optional[str] = None
    fighting_for: Optional[str] = None
    diagnosis_date: Optional[str] = None
    favorite_color: Optional[str] = "#ec4899"  # Default pink
    theme_preference: Optional[str] = "soft"  # soft, vibrant, minimal
    
    # Treatment journey
    treatment_milestones: List[Dict[str, Any]] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CaregiverInvitation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    caregiver_email: EmailStr
    caregiver_name: str
    status: str = "pending"  # pending, accepted, declined
    invited_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    accepted_at: Optional[datetime] = None

class CaregiverAccess(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    caregiver_id: str
    granted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Health Data Models (updated with user_id)
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

# Request/Response Models
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    personal_mantra: Optional[str] = None
    fighting_for: Optional[str] = None
    diagnosis_date: Optional[str] = None
    favorite_color: Optional[str] = None
    theme_preference: Optional[str] = None

class MilestoneRequest(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    milestone_type: str  # diagnosis, treatment_start, surgery, remission, etc.

class CaregiverInviteRequest(BaseModel):
    caregiver_email: str = Field(..., description="Email of the caregiver to invite")
    caregiver_name: str = Field(..., description="Name of the caregiver")

class BarcodeRequest(BaseModel):
    barcode: str = Field(..., min_length=1, description="Barcode must not be empty")
    patient_preferences: Optional[Dict[str, Any]] = None

class NutritionAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    barcode: str
    product_name: str
    brand: Optional[str] = None
    ingredients: Optional[str] = None
    allergens: List[str] = Field(default_factory=list)
    nutrition_grade: Optional[str] = None
    nova_group: Optional[int] = None
    nutriments: Dict[str, float] = Field(default_factory=dict)
    categories: List[str] = Field(default_factory=list)
    health_score: Optional[float] = None
    cancer_patient_score: Optional[float] = None
    recommendations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    alternatives: List[str] = Field(default_factory=list)
    image_url: Optional[str] = None
    analysis_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductSearchResult(BaseModel):
    barcode: str
    product_name: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    nutrition_grade: Optional[str] = None