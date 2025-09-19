from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from models import UserProfile, UserSession
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

logger = logging.getLogger(__name__)

# Database dependency - will be set by the main application
_db_instance = None

def set_database(db: AsyncIOMotorDatabase):
    """Set the database instance for dependency injection"""
    global _db_instance
    _db_instance = db

def get_database() -> AsyncIOMotorDatabase:
    """Get database dependency"""
    if _db_instance is None:
        raise RuntimeError("Database not initialized. Call set_database() first.")
    return _db_instance

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.emergent_auth_url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
    
    async def process_session_id(self, session_id: str) -> Optional[dict]:
        """Process session ID from Emergent Auth and get user data"""
        try:
            headers = {"X-Session-ID": session_id}
            async with httpx.AsyncClient() as client:
                response = await client.get(self.emergent_auth_url, headers=headers)
                
                if response.status_code == 200:
                    user_data = response.json()
                    
                    # Create or update user in database
                    await self.create_or_update_user(user_data)
                    
                    # Create session
                    session_token = user_data.get("session_token")
                    if session_token:
                        await self.store_session(user_data["id"], session_token)
                    
                    return user_data
                else:
                    logger.error(f"Failed to get session data: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error processing session ID: {str(e)}")
            return None
    
    async def create_or_update_user(self, user_data: dict):
        """Create or update user profile"""
        try:
            existing_user = await self.db.users.find_one({"email": user_data["email"]})
            
            if not existing_user:
                # Create new user
                new_user = UserProfile(
                    id=user_data["id"],
                    email=user_data["email"],
                    name=user_data["name"],
                    picture=user_data.get("picture")
                )
                await self.db.users.insert_one(new_user.dict())
                logger.info(f"Created new user: {user_data['email']}")
            else:
                # Update existing user (only picture and name)
                await self.db.users.update_one(
                    {"email": user_data["email"]},
                    {"$set": {
                        "name": user_data["name"],
                        "picture": user_data.get("picture"),
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )
                logger.info(f"Updated existing user: {user_data['email']}")
                
        except Exception as e:
            logger.error(f"Error creating/updating user: {str(e)}")
    
    async def store_session(self, user_id: str, session_token: str):
        """Store session token in database"""
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            
            session = UserSession(
                user_id=user_id,
                session_token=session_token,
                expires_at=expires_at
            )
            
            # Remove existing sessions for this user
            await self.db.sessions.delete_many({"user_id": user_id})
            
            # Store new session
            await self.db.sessions.insert_one(session.dict())
            
        except Exception as e:
            logger.error(f"Error storing session: {str(e)}")
    
    async def validate_session_token(self, session_token: str) -> Optional[str]:
        """Validate session token and return user_id"""
        try:
            session = await self.db.sessions.find_one({"session_token": session_token})
            
            if not session:
                return None
            
            # Check expiry
            if session["expires_at"] < datetime.now(timezone.utc):
                # Remove expired session
                await self.db.sessions.delete_one({"session_token": session_token})
                return None
            
            return session["user_id"]
            
        except Exception as e:
            logger.error(f"Error validating session: {str(e)}")
            return None
    
    async def get_current_user(self, request: Request) -> Optional[UserProfile]:
        """Get current user from session token (cookie or header)"""
        try:
            # First try cookie
            session_token = request.cookies.get("session_token")
            
            # Fallback to Authorization header
            if not session_token:
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    session_token = auth_header.split(" ")[1]
            
            if not session_token:
                return None
            
            user_id = await self.validate_session_token(session_token)
            if not user_id:
                return None
            
            user_data = await self.db.users.find_one({"id": user_id})
            if user_data:
                return UserProfile(**user_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting current user: {str(e)}")
            return None
    
    async def logout_user(self, session_token: str):
        """Logout user by removing session"""
        try:
            await self.db.sessions.delete_many({"session_token": session_token})
        except Exception as e:
            logger.error(f"Error logging out user: {str(e)}")

# Dependency for getting current user
async def get_current_user_dependency(request: Request, auth_service: AuthService = Depends()) -> UserProfile:
    """FastAPI dependency for getting current user"""
    user = await auth_service.get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def get_optional_current_user(request: Request, auth_service: AuthService = Depends()) -> Optional[UserProfile]:
    """FastAPI dependency for optionally getting current user"""
    return await auth_service.get_current_user(request)