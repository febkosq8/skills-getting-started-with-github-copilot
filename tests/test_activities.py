from importlib import import_module
from fastapi.testclient import TestClient
import pytest

appmod = import_module('src.app')
client = TestClient(appmod.app)

ACTIVITY = 'Chess Club'
NEW_EMAIL = 'pytest_user@example.com'


def test_get_activities_contains_activity():
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert ACTIVITY in data


def test_signup_and_unregister_flow():
    # ensure clean state
    client.delete(f"/activities/{ACTIVITY}/unregister",
                  params={'email': NEW_EMAIL})

    # signup should succeed
    resp = client.post(
        f"/activities/{ACTIVITY}/signup", params={'email': NEW_EMAIL})
    assert resp.status_code == 200
    assert 'Signed up' in resp.json().get('message', '')

    # duplicate signup should return 400
    resp2 = client.post(
        f"/activities/{ACTIVITY}/signup", params={'email': NEW_EMAIL})
    assert resp2.status_code == 400

    # GET activities should include the new email
    resp3 = client.get('/activities')
    assert resp3.status_code == 200
    participants = resp3.json()[ACTIVITY]['participants']
    assert NEW_EMAIL in participants

    # unregister should succeed
    resp4 = client.delete(
        f"/activities/{ACTIVITY}/unregister", params={'email': NEW_EMAIL})
    assert resp4.status_code == 200
    assert 'Unregistered' in resp4.json().get('message', '')

    # ensure it's gone
    resp5 = client.get('/activities')
    participants2 = resp5.json()[ACTIVITY]['participants']
    assert NEW_EMAIL not in participants2
