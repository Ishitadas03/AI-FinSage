from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["app"] == "FinSage API"


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data
    assert data["service"] == "FinSage API"


def test_database_health_endpoint_structure():
    response = client.get("/api/v1/health/db")
    # Response will either be 200 (if DB is up) or 503 (if DB is down)
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "healthy"
        assert data["connected"] is True
    else:
        data = response.json()
        assert "detail" in data
        assert data["detail"]["connected"] is False
        assert data["detail"]["status"] == "unhealthy"
