import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

Base = declarative_base()
engine = None
_session_factory = None

def init_db(database_uri="sqlite:///database/signbridge.db"):
    global engine, _session_factory
    if database_uri.startswith("sqlite:///"):
        db_path = database_uri.replace("sqlite:///", "")
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    engine = create_engine(database_uri, echo=False, connect_args={"check_same_thread": False})
    _session_factory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    
    from database import models
    Base.metadata.create_all(bind=engine)
    return _session_factory

def get_session():
    global _session_factory
    if _session_factory is None:
        from config import Config
        init_db(Config.SQLALCHEMY_DATABASE_URI)
    return _session_factory()

class SessionLocalProxy:
    def __call__(self, *args, **kwargs):
        return get_session()
    def __getattr__(self, name):
        return getattr(get_session(), name)

SessionLocal = SessionLocalProxy()

def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()
