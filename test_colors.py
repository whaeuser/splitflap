#!/usr/bin/env python3
"""
Test script for color functionality
"""
import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_colors():
    """Test different color configurations"""

    print("Testing per-line color control...")
    print()

    # Test 1: Individual line format with colors
    print("Test 1: Individual lines with different colors")
    data = {
        "line1": "BLAU",
        "line2": "HELLBLAU",
        "line3": "ROT",
        "line4": "GRUEN",
        "line5": "ORANGE",
        "line6": "GELB",
        "color1": "blau",
        "color2": "hellblau",
        "color3": "rot",
        "color4": "gruen",
        "color5": "orange",
        "color6": "gelb"
    }

    response = requests.post(f"{BASE_URL}/api/display", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

    time.sleep(5)

    # Test 2: Array format with colors
    print("Test 2: Array format with colors")
    data = {
        "lines": ["VIOLETT", "ROSA", "HELLGRUEN", "TEST 1", "TEST 2", "TEST 3"],
        "colors": ["violett", "rosa", "hellgruen", "blau", "rot", "gelb"]
    }

    response = requests.post(f"{BASE_URL}/api/display", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

    time.sleep(5)

    # Test 3: Mixed - some with colors, some without
    print("Test 3: Mixed colors (some lines with color, some default)")
    data = {
        "line1": "MIT FARBE",
        "line2": "OHNE FARBE",
        "line3": "MIT FARBE",
        "line4": "OHNE FARBE",
        "line5": "MIT FARBE",
        "line6": "ENDE",
        "color1": "rot",
        "color3": "gruen",
        "color5": "blau"
    }

    response = requests.post(f"{BASE_URL}/api/display", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

    time.sleep(5)

    # Test 4: Clear display
    print("Test 4: Clear display")
    response = requests.post(f"{BASE_URL}/api/clear")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

    print("All tests completed!")
    print()
    print("Available colors:")
    colors = ["blau", "hellblau", "rot", "gruen", "hellgruen", "orange", "violett", "rosa", "gelb", "weiss"]
    for color in colors:
        print(f"  - {color}")
    print()
    print("Default color: weiss (white)")

if __name__ == "__main__":
    try:
        test_colors()
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to server. Make sure the server is running on port 8001")
        print("Start it with: python3 simple_server.py 8001")
    except Exception as e:
        print(f"Error: {e}")
