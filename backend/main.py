from fastapi import FastAPI, File, UploadFile, Depends, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import re
import random
import hashlib
from difflib import SequenceMatcher

from database import engine, get_db
import models

# Recreate tables to apply the new User architecture
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Speech Therapy API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXERCISES = {
    "en-US": [
        "Artificial intelligence helps to analyze speech patterns in real time.",
        "The quick brown fox jumps over the lazy dog.",
        "She sells seashells by the seashore to practice pronunciation.",
        "A proper cup of coffee from a proper copper coffee pot."
    ],
    "es-ES": [
        "La inteligencia artificial ayuda a analizar patrones del habla.",
        "El perro juguetón corre rápidamente por el campo verde.",
        "Tres tristes tigres tragaban trigo en un trigal."
    ],
    "fr-FR": [
        "L'intelligence artificielle aide à analyser la parole en temps réel.",
        "Le chat noir court vite dans le jardin fleuri.",
        "Les chaussettes de l'archiduchesse sont-elles sèches ?"
    ],
    "hi-IN": [
        "कृत्रिम बुद्धिमत्ता वास्तविक समय में भाषण पैटर्न का विश्लेषण करती है।",
        "समझ समझ के समझ को समझो, समझ समझना भी एक समझ है।",
        "भयानक भालू भयंकर भूखा भाग रहा था।"
    ]
}

def clean_text(text: str):
    text = re.sub(r'[^\w\s]', '', text)
    return text.lower().strip()

# --- AUTHENTICATION ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/api/signup")
def signup(username: str = Form(...), email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter((models.User.username == username) | (models.User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    hashed_pwd = hash_password(password)
    new_user = models.User(username=username, email=email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user_id": new_user.id, "username": new_user.username}

@app.post("/api/login")
def login(username_or_email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.username == username_or_email) | (models.User.email == username_or_email)
    ).first()
    
    if not user or user.hashed_password != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    return {"status": "success", "user_id": user.id, "username": user.username}

# --- ENDPOINTS ---
@app.get("/api/next-exercise")
def get_next_exercise(lang: str = "en-US", user_id: int = 0, db: Session = Depends(get_db)):
    if lang not in EXERCISES:
        lang = "en-US"
        
    sentences = EXERCISES[lang]
    
    # Adaptive: Filter specifically by the logged-in user's past recordings
    if user_id > 0:
        bad_words = db.query(models.WordAssessment).join(models.AssessmentRecording).filter(
            models.AssessmentRecording.user_id == user_id,
            models.WordAssessment.accuracy_score < 70
        ).order_by(models.WordAssessment.id.desc()).limit(15).all()
        
        if bad_words and len(sentences) > 1:
            bad_chars = set()
            for bw in bad_words:
                bad_chars.update(list(bw.word.lower()))
                
            best_sentence = sentences[0]
            best_score = -1
            
            for s in sentences:
                score = sum(1 for c in s.lower() if c in bad_chars)
                score += random.randint(0, 5) 
                if score > best_score:
                    best_score = score
                    best_sentence = s
            chosen = best_sentence
            return {"exercise": chosen, "language": lang, "adaptive": True}

    chosen = random.choice(sentences)
    return {"exercise": chosen, "language": lang, "adaptive": False}

@app.post("/api/assess-speech")
async def assess_speech(
    audio: UploadFile = File(...),
    spoken_text: str = Form(""), 
    expected_text: str = Form(...),
    user_id: int = Form(...), 
    db: Session = Depends(get_db)
):
    target_text = expected_text
    words_expected = target_text.split()
    
    clean_spoken = clean_text(spoken_text)
    spoken_words = clean_spoken.split()

    word_results = []
    total_acc = 0
    words_found = 0
    
    for word in words_expected:
        clean_word = clean_text(word)
        best_match_score = 0
        error_type = "Omission"
        
        for sw in spoken_words:
            ratio = SequenceMatcher(None, clean_word, sw).ratio()
            if ratio > best_match_score:
                best_match_score = ratio
                
        acc_score = int(best_match_score * 100)
        
        if acc_score > 90:
            error_type = "None"
        elif acc_score > 50:
            error_type = "Mispronunciation"
        elif acc_score == 0:
            error_type = "Omitted / Not Spoken"
            
        if acc_score > 40: 
            words_found += 1
            
        total_acc += acc_score
        
        word_results.append({
            "word": word,
            "accuracy_score": acc_score,
            "error_type": error_type
        })
        
    avg_accuracy = int(total_acc / len(words_expected)) if words_expected else 0
    completeness = int((words_found / len(words_expected)) * 100)
    fluency = avg_accuracy 
    pronunciation = int((avg_accuracy + fluency + completeness) / 3)

    new_assessment = models.AssessmentRecording(
        user_id=user_id,
        text_practiced=target_text,
        accuracy_score=avg_accuracy,
        fluency_score=fluency,
        completeness_score=completeness,
        pronunciation_score=pronunciation
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    for word_info in word_results:
        db.add(models.WordAssessment(
            assessment_id=new_assessment.id,
            word=word_info['word'],
            accuracy_score=word_info['accuracy_score'],
            error_type=word_info['error_type']
        ))
    db.commit()

    return {
        "status": "success",
        "mock_response": False, 
        "spoken": clean_spoken,
        "results": {
            "accuracy_score": avg_accuracy,
            "fluency_score": fluency,
            "completeness_score": completeness,
            "pronunciation_score": pronunciation,
            "words": word_results
        }
    }

@app.get("/api/progress")
def get_progress(user_id: int, db: Session = Depends(get_db)):
    assessments = db.query(models.AssessmentRecording).filter(
        models.AssessmentRecording.user_id == user_id
    ).order_by(models.AssessmentRecording.timestamp.asc()).limit(20).all()
    
    history = []
    for a in assessments:
         history.append({
            "id": a.id,
            "timestamp": a.timestamp.isoformat(),
            "accuracy": int(a.accuracy_score),
            "fluency": int(a.fluency_score),
            "pronunciation": int(a.pronunciation_score),
            "completeness": int(a.completeness_score)
        })
        
    words = db.query(models.WordAssessment).join(models.AssessmentRecording).filter(
        models.AssessmentRecording.user_id == user_id,
        models.WordAssessment.accuracy_score < 70
    ).all()
    
    weak_spots = {}
    for w in words:
        clean_word = w.word.strip(',.')
        if clean_word not in weak_spots:
            weak_spots[clean_word] = 0
        weak_spots[clean_word] += 1
        
    sorted_weak_spots = sorted(weak_spots.items(), key=lambda x: x[1], reverse=True)[:5]
    return {
        "history": history,
        "weak_spots": [{"word": k, "error_count": v} for k, v in sorted_weak_spots]
    }

@app.get("/api/profile")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    total_assessments = db.query(models.AssessmentRecording).filter(
        models.AssessmentRecording.user_id == user_id
    ).count()
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "total_assessments": total_assessments
    }

@app.put("/api/profile")
def update_profile(
    user_id: int = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(""),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for collisions with other users
    collision = db.query(models.User).filter(
        (models.User.id != user_id) & 
        ((models.User.username == username) | (models.User.email == email))
    ).first()
    if collision:
        raise HTTPException(status_code=400, detail="Username or Email already taken by another user")

    user.username = username
    user.email = email
    
    # Only securely hash and overwrite if the user actively provided a new password string
    if password.strip():
        user.hashed_password = hash_password(password)

    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "Profile updated", "user": {"id": user.id, "username": user.username}}
