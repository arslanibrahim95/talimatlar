from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import json

app = FastAPI(title="AI Integration Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime

class ChatSession(BaseModel):
    id: str
    userId: str
    messages: List[ChatMessage]
    context: Dict[str, Any]
    createdAt: datetime
    updatedAt: datetime

class AIResponse(BaseModel):
    content: str
    usage: Dict[str, int]
    model: str
    provider: str

# In-memory storage
chat_sessions = {}
session_id_counter = 1

# Configuration
ai_config = {
    "openai": {
        "enabled": bool(os.getenv("OPENAI_API_KEY")),
        "model": "gpt-4",
        "api_key": os.getenv("OPENAI_API_KEY", ""),
        "max_tokens": 1000,
        "temperature": 0.7
    },
    "claude": {
        "enabled": bool(os.getenv("CLAUDE_API_KEY")),
        "model": "claude-3-sonnet-20240229",
        "api_key": os.getenv("CLAUDE_API_KEY", ""),
        "max_tokens": 1000,
        "temperature": 0.7
    },
    "local": {
        "enabled": False,
        "endpoint": "http://localhost:11434",
        "model": "llama2"
    }
}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-integration-service",
        "timestamp": datetime.now().isoformat(),
        "providers": [
            {
                "name": "openai",
                "model": ai_config["openai"]["model"],
                "enabled": ai_config["openai"]["enabled"]
            },
            {
                "name": "claude",
                "model": ai_config["claude"]["model"],
                "enabled": ai_config["claude"]["enabled"]
            },
            {
                "name": "local",
                "model": ai_config["local"]["model"],
                "enabled": ai_config["local"]["enabled"]
            }
        ]
    }

@app.post("/chat/sessions")
async def create_chat_session(session_data: dict):
    global session_id_counter
    
    session_id = f"session_{session_id_counter}_{datetime.now().timestamp()}"
    session = ChatSession(
        id=session_id,
        userId=session_data.get("userId", "anonymous"),
        messages=[],
        context={},
        createdAt=datetime.now(),
        updatedAt=datetime.now()
    )
    
    chat_sessions[session_id] = session
    session_id_counter += 1
    
    return {"success": True, "data": {"sessionId": session_id, "session": session}}

@app.get("/chat/sessions/{session_id}")
async def get_chat_session(session_id: str):
    session = chat_sessions.get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True, "data": session}

@app.post("/chat/sessions/{session_id}/messages")
async def send_message(session_id: str, message_data: dict):
    session = chat_sessions.get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    message = message_data.get("message", "")
    provider = message_data.get("provider", "openai")
    
    # Add user message
    user_message = ChatMessage(
        role="user",
        content=message,
        timestamp=datetime.now()
    )
    session.messages.append(user_message)
    
    # Get AI response
    try:
        ai_response = await get_ai_response(session.messages, provider)
        
        # Add AI response
        assistant_message = ChatMessage(
            role="assistant",
            content=ai_response["content"],
            timestamp=datetime.now()
        )
        session.messages.append(assistant_message)
        session.updatedAt = datetime.now()
        
        return {
            "success": True,
            "data": {
                "userMessage": user_message,
                "assistantMessage": assistant_message,
                "usage": ai_response["usage"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_ai_response(messages: List[ChatMessage], provider_name: str) -> Dict[str, Any]:
    if not ai_config[provider_name]["enabled"]:
        raise Exception(f"Provider {provider_name} is not enabled")
    
    if provider_name == "openai":
        return await get_openai_response(messages)
    elif provider_name == "claude":
        return await get_claude_response(messages)
    elif provider_name == "local":
        return await get_local_response(messages)
    else:
        raise Exception(f"Unsupported provider: {provider_name}")

async def get_openai_response(messages: List[ChatMessage]) -> Dict[str, Any]:
    # Simulated OpenAI response
    return {
        "content": "Bu bir simüle edilmiş OpenAI yanıtıdır. Gerçek API anahtarı yapılandırıldığında OpenAI API'si kullanılacak.",
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 30,
            "total_tokens": 80
        },
        "model": "gpt-4",
        "provider": "openai"
    }

async def get_claude_response(messages: List[ChatMessage]) -> Dict[str, Any]:
    # Simulated Claude response
    return {
        "content": "Bu bir simüle edilmiş Claude yanıtıdır. Gerçek API anahtarı yapılandırıldığında Claude API'si kullanılacak.",
        "usage": {
            "input_tokens": 50,
            "output_tokens": 30,
            "total_tokens": 80
        },
        "model": "claude-3-sonnet-20240229",
        "provider": "claude"
    }

async def get_local_response(messages: List[ChatMessage]) -> Dict[str, Any]:
    # Simulated local model response
    return {
        "content": "Bu bir simüle edilmiş yerel model yanıtıdır. Ollama veya LM Studio gibi yerel modeller yapılandırıldığında kullanılacak.",
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 30,
            "total_tokens": 80
        },
        "model": "llama2",
        "provider": "local"
    }

@app.post("/commands/execute")
async def execute_system_command(command_data: dict):
    command = command_data.get("command", "")
    session_id = command_data.get("sessionId", "")
    user_id = command_data.get("userId", "")
    
    # Simple command processing
    command_lower = command.lower()
    
    if "kullanıcı" in command_lower and "listele" in command_lower:
        return {
            "success": True,
            "data": {
                "type": "user_list",
                "message": "Kullanıcı listesi alındı (simüle edildi)",
                "data": ["user1", "user2", "user3"]
            }
        }
    elif "sistem" in command_lower and "durum" in command_lower:
        return {
            "success": True,
            "data": {
                "type": "system_status",
                "message": "Sistem durumu kontrol edildi",
                "data": [
                    {"name": "Auth Service", "status": "healthy"},
                    {"name": "Analytics Service", "status": "healthy"},
                    {"name": "Instruction Service", "status": "healthy"}
                ]
            }
        }
    else:
        return {
            "success": True,
            "data": {
                "message": "Komut anlaşılamadı. Lütfen daha spesifik bir komut verin.",
                "suggestions": [
                    "Kullanıcıları listele",
                    "Sistem durumunu kontrol et",
                    "Talimatları listele"
                ]
            }
        }

@app.get("/config/api-keys")
async def get_api_key_config():
    return {
        "success": True,
        "data": {
            "openai": {
                "enabled": ai_config["openai"]["enabled"],
                "model": ai_config["openai"]["model"],
                "hasKey": bool(ai_config["openai"]["api_key"])
            },
            "claude": {
                "enabled": ai_config["claude"]["enabled"],
                "model": ai_config["claude"]["model"],
                "hasKey": bool(ai_config["claude"]["api_key"])
            },
            "local": {
                "enabled": ai_config["local"]["enabled"],
                "endpoint": ai_config["local"]["endpoint"],
                "model": ai_config["local"]["model"]
            }
        }
    }

@app.get("/analytics/usage")
async def get_usage_analytics():
    total_sessions = len(chat_sessions)
    total_messages = sum(len(session.messages) for session in chat_sessions.values())
    active_sessions = len([
        session for session in chat_sessions.values()
        if (datetime.now() - session.updatedAt).days < 1
    ])
    
    return {
        "success": True,
        "data": {
            "totalSessions": total_sessions,
            "totalMessages": total_messages,
            "activeSessions": active_sessions,
            "providers": ai_config
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
