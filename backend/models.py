from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # establish relationship mapping
    assessments = relationship("AssessmentRecording", back_populates="user")

class AssessmentRecording(Base):
    __tablename__ = "assessment_recordings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    text_practiced = Column(String)
    accuracy_score = Column(Float)
    fluency_score = Column(Float)
    completeness_score = Column(Float)
    pronunciation_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")
    words = relationship("WordAssessment", back_populates="assessment")

class WordAssessment(Base):
    __tablename__ = "word_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessment_recordings.id"))
    word = Column(String)
    accuracy_score = Column(Float)
    error_type = Column(String) # Omission, Substitution, None
    timestamp = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentRecording", back_populates="words")
