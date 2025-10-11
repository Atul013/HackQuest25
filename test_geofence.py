#!/usr/bin/env python3
"""
Geofence Testing Script
Tests if a point (x,y) is inside any of the 4 venue geofences
Works offline - no cloud connection needed!
"""

import json
from typing import List, Tuple

# ========================================
# VENUE POLYGONS (from kochi-venues-setup.sql)
# ========================================

VENUES = {
    "Ernakulam Junction Railway Station": [
        [9.9742998, 76.2899817],
        [9.9693476, 76.2904496],
        [9.9691786, 76.2903102],
        [9.9685445, 76.290396],
        [9.9685234, 76.2907393],
        [9.9657971, 76.2917371],
        [9.9657232, 76.292059],
        [9.9669172, 76.2921341],
        [9.9686677, 76.2919773],
        [9.9720914, 76.2911941],
        [9.9743315, 76.2904431],
        [9.9742998, 76.2899817]
    ],
    "Cochin International Airport": [
        [10.159892, 76.385748],
        [10.1566815, 76.3858338],
        [10.1546539, 76.3828727],
        [10.1545272, 76.3802549],
        [10.1486976, 76.3804265],
        [10.1499649, 76.4200803],
        [10.1545272, 76.4195653],
        [10.1539358, 76.4045879],
        [10.1568083, 76.4044162],
        [10.1578221, 76.4011117],
        [10.1603144, 76.4005967],
        [10.159892, 76.385748]
    ],
    "Lulu Mall Kochi": [
        [10.0305599, 76.3069647],
        [10.027158, 76.3063425],
        [10.0264184, 76.3058275],
        [10.0252774, 76.3066643],
        [10.0250027, 76.3086599],
        [10.0265029, 76.3098615],
        [10.0270101, 76.3107842],
        [10.0257, 76.3120073],
        [10.0258479, 76.3130372],
        [10.0283835, 76.3127583],
        [10.0300316, 76.3099473],
        [10.0305599, 76.3069647]
    ],
    "Rajagiri School of Engineering & Technology": [
        [9.994284, 76.3552391],
        [9.9940852, 76.3552435],
        [9.9936414, 76.355104],
        [9.9932293, 76.3551791],
        [9.9927327, 76.3558228],
        [9.9924369, 76.3561876],
        [9.9922256, 76.3566811],
        [9.9919826, 76.3572283],
        [9.9917059, 76.3590908],
        [9.9917587, 76.3597452],
        [9.9917164, 76.3602066],
        [9.9917481, 76.360507],
        [9.9920228, 76.3605284],
        [9.9922342, 76.3606679],
        [9.99253, 76.3607001],
        [9.9928576, 76.3608181],
        [9.9930583, 76.3608932],
        [9.9930794, 76.3607323],
        [9.9935655, 76.3605714],
        [9.9936289, 76.3602388],
        [9.9938508, 76.3602173],
        [9.9939036, 76.3598847],
        [9.9941149, 76.3597989],
        [9.994844, 76.3598203],
        [9.9944742, 76.3590586],
        [9.994041, 76.3581574],
        [9.9940938, 76.3572454],
        [9.994284, 76.3552391]
    ]
}

# ========================================
# RAY CASTING ALGORITHM
# ========================================

def is_point_in_polygon(point: Tuple[float, float], polygon: List[List[float]]) -> bool:
    """
    Ray casting algorithm to check if a point is inside a polygon.
    
    Args:
        point: (latitude, longitude) tuple
        polygon: List of [latitude, longitude] coordinate pairs
    
    Returns:
        True if point is inside polygon, False otherwise
    """
    lat, lon = point
    inside = False
    
    n = len(polygon)
    p1_lat, p1_lon = polygon[0]
    
    for i in range(1, n + 1):
        p2_lat, p2_lon = polygon[i % n]
        
        # Check if point is within the latitude range of the edge
        if lat > min(p1_lat, p2_lat):
            if lat <= max(p1_lat, p2_lat):
                if lon <= max(p1_lon, p2_lon):
                    # Calculate x intersection
                    if p1_lat != p2_lat:
                        xinters = (lat - p1_lat) * (p2_lon - p1_lon) / (p2_lat - p1_lat) + p1_lon
                    
                    # Check if point is on the edge or crosses it
                    if p1_lon == p2_lon or lon <= xinters:
                        inside = not inside
        
        p1_lat, p1_lon = p2_lat, p2_lon
    
    return inside

# ========================================
# TESTING FUNCTIONS
# ========================================

def test_point(latitude: float, longitude: float):
    """
    Test if a point is inside any venue geofence.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
    """
    print("=" * 60)
    print("🔍 GEOFENCE TESTING")
    print("=" * 60)
    print(f"📍 Testing Point: {latitude}°N, {longitude}°E")
    print("=" * 60)
    
    point = (latitude, longitude)
    found_venue = False
    
    for venue_name, polygon in VENUES.items():
        is_inside = is_point_in_polygon(point, polygon)
        
        if is_inside:
            print(f"✅ INSIDE: {venue_name}")
            print(f"   Polygon has {len(polygon)} points")
            found_venue = True
        else:
            print(f"❌ Outside: {venue_name}")
    
    print("=" * 60)
    
    if found_venue:
        print("🎯 Result: Point is INSIDE a geofenced area")
    else:
        print("🚫 Result: Point is OUTSIDE all geofenced areas")
    
    print("=" * 60)
    return found_venue

# ========================================
# PREDEFINED TEST CASES
# ========================================

TEST_CASES = {
    "Ernakulam Station (inside)": (9.9710, 76.2910),
    "Cochin Airport (inside)": (10.1550, 76.4000),
    "Lulu Mall (inside)": (10.0278, 76.3090),
    "Rajagiri Campus (inside)": (9.9935, 76.3585),
    "Random Point (outside)": (10.0000, 76.3000),
    "Marine Drive (outside)": (9.9640, 76.2820),
}

def run_all_tests():
    """Run all predefined test cases"""
    print("\n" + "=" * 60)
    print("🧪 RUNNING ALL TEST CASES")
    print("=" * 60)
    
    for test_name, (lat, lon) in TEST_CASES.items():
        print(f"\n📋 Test: {test_name}")
        test_point(lat, lon)
        print()

# ========================================
# INTERACTIVE MODE
# ========================================

def interactive_mode():
    """Interactive mode to test custom coordinates"""
    print("\n" + "=" * 60)
    print("🎮 INTERACTIVE GEOFENCE TESTING")
    print("=" * 60)
    print("Enter coordinates to test if they're inside any venue.")
    print("Type 'exit' to quit, 'test' to run all test cases.")
    print("=" * 60)
    
    while True:
        try:
            user_input = input("\n📍 Enter command or coordinates (lat,lon): ").strip()
            
            if user_input.lower() == 'exit':
                print("👋 Goodbye!")
                break
            
            if user_input.lower() == 'test':
                run_all_tests()
                continue
            
            if user_input.lower() == 'help':
                print("\nCommands:")
                print("  lat,lon  - Test specific coordinates (e.g., 9.9710,76.2910)")
                print("  test     - Run all predefined test cases")
                print("  venues   - Show all venue coordinates")
                print("  exit     - Quit the program")
                continue
            
            if user_input.lower() == 'venues':
                print("\n📋 VENUE COORDINATES:")
                for venue_name, polygon in VENUES.items():
                    centroid_lat = sum(p[0] for p in polygon) / len(polygon)
                    centroid_lon = sum(p[1] for p in polygon) / len(polygon)
                    print(f"\n  {venue_name}")
                    print(f"  Centroid: {centroid_lat:.6f}°N, {centroid_lon:.6f}°E")
                    print(f"  Points: {len(polygon)}")
                continue
            
            # Parse coordinates
            parts = user_input.split(',')
            if len(parts) != 2:
                print("❌ Invalid format. Use: latitude,longitude (e.g., 9.9710,76.2910)")
                continue
            
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            
            test_point(lat, lon)
            
        except ValueError:
            print("❌ Invalid coordinates. Please enter numbers.")
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

# ========================================
# MAIN
# ========================================

if __name__ == "__main__":
    import sys
    
    print("\n" + "=" * 60)
    print("🗺️  HACKQUEST25 - GEOFENCE TESTING TOOL")
    print("=" * 60)
    print("Tests if a point is inside any of the 4 venue geofences")
    print("Uses ray casting algorithm (same as frontend)")
    print("=" * 60)
    
    if len(sys.argv) == 3:
        # Command line mode: python test_geofence.py <lat> <lon>
        try:
            lat = float(sys.argv[1])
            lon = float(sys.argv[2])
            test_point(lat, lon)
        except ValueError:
            print("❌ Invalid coordinates. Usage: python test_geofence.py <latitude> <longitude>")
            sys.exit(1)
    elif len(sys.argv) == 2 and sys.argv[1].lower() == 'test':
        # Run all tests: python test_geofence.py test
        run_all_tests()
    else:
        # Interactive mode
        interactive_mode()
