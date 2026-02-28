#!/usr/bin/env python3
"""
Hostel ERP Backend API Test Suite - Robust Version
Tests all critical backend functionality including synchronization
"""

import json
import requests
import uuid
import time
from datetime import datetime, date

# Get base URL from environment
BASE_URL = "https://hostel-erp-2.preview.emergentagent.com/api"
print(f"🔗 Testing backend API at: {BASE_URL}")

# Test data
admin_credentials = {
    "mobile": "9999999999",
    "password": "9999",
    "role": "ADMIN"
}

# Global variables for test data
auth_token = None
branch_id = None
room_id = None
bed_id = None
manager_id = None
tenant_id = None
payment_id = None

def make_request(method, endpoint, data=None, headers=None, timeout=60):
    """Make HTTP request with proper error handling and retries"""
    url = f"{BASE_URL}{endpoint}"
    
    default_headers = {'Content-Type': 'application/json'}
    if headers:
        default_headers.update(headers)
    
    for attempt in range(3):  # 3 attempts
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
            
        except requests.exceptions.Timeout:
            print(f"   ⏱️ Request timeout on attempt {attempt + 1}/3")
            if attempt == 2:
                print(f"   ❌ All attempts failed due to timeout")
                return None
            time.sleep(1)
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed on attempt {attempt + 1}/3: {e}")
            if attempt == 2:
                return None
            time.sleep(1)
    
    return None

def test_authentication():
    """Test 1: Authentication API - Admin Login"""
    global auth_token
    
    print("\n🔐 Testing Authentication...")
    
    response = make_request('POST', '/auth/login', admin_credentials)
    
    if not response:
        print("❌ Authentication test failed - No response")
        return False
        
    if response.status_code == 200:
        data = response.json()
        if 'token' in data and 'user' in data:
            auth_token = data['token']
            user = data['user']
            
            print(f"✅ Admin login successful")
            print(f"   👤 User: {user['name']} ({user['role']})")
            print(f"   📱 Mobile: {user['mobile']}")
            print(f"   🔑 Token received: {auth_token[:20]}...")
            return True
        else:
            print(f"❌ Login response missing token or user: {data}")
            return False
    else:
        print(f"❌ Login failed with status {response.status_code}: {response.text}")
        return False

def test_branch_management():
    """Test 2: Branch Management API"""
    global branch_id
    
    print("\n🏢 Testing Branch Management...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
        
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test GET branches
    response = make_request('GET', '/branches', headers=headers)
    if not response or response.status_code != 200:
        print(f"❌ GET branches failed: {response.status_code if response else 'No response'}")
        return False
        
    initial_branches = response.json()
    print(f"✅ GET /branches successful - Found {len(initial_branches)} existing branches")
    
    # If there's already a branch, use it
    if initial_branches:
        branch_id = initial_branches[0]['branchId']
        print(f"✅ Using existing branch: {branch_id}")
        return True
    
    # Test POST branch creation with unique code
    branch_code = f'TB{str(uuid.uuid4())[:6]}'.upper()
    branch_data = {
        "name": f"Test Branch {branch_code}",
        "code": branch_code,
        "address": "123 Test Street, Test City",
        "city": "Mumbai", 
        "phone": "9876543210",
        "facilities": ["WiFi", "AC", "Laundry"],
        "foodDetails": "Breakfast and Dinner included"
    }
    
    print(f"   Creating new branch with code: {branch_code}")
    response = make_request('POST', '/branches', branch_data, headers)
    if not response or response.status_code != 200:
        print(f"❌ POST branch failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False
        
    create_result = response.json()
    if 'branchId' in create_result:
        branch_id = create_result['branchId']
        print(f"✅ Branch created successfully")
        print(f"   🏢 Branch ID: {branch_id}")
        print(f"   📍 Name: {branch_data['name']}")
        return True
    else:
        print(f"❌ Branch creation response missing branchId: {create_result}")
        return False

def test_room_and_bed_management():
    """Test 3: Room & Bed Management API"""
    global room_id, bed_id
    
    print("\n🛏️ Testing Room & Bed Management...")
    
    if not auth_token or not branch_id:
        print("❌ Missing auth token or branch ID")
        return False
        
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test POST room creation
    room_data = {
        "branchId": branch_id,
        "roomNumber": "101",
        "floor": 1,
        "totalBeds": 4,
        "type": "SHARED"
    }
    
    response = make_request('POST', '/rooms', room_data, headers)
    if not response or response.status_code != 200:
        print(f"❌ POST room failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False
        
    room_result = response.json()
    if 'roomId' in room_result:
        room_id = room_result['roomId']
        print(f"✅ Room created successfully")
        print(f"   🏠 Room ID: {room_id}")
        print(f"   🔢 Room Number: {room_data['roomNumber']}")
    else:
        print(f"❌ Room creation response missing roomId: {room_result}")
        return False
    
    # Test POST bed creation
    bed_data = {
        "roomId": room_id,
        "branchId": branch_id,
        "bedNumber": "101-A"
    }
    
    response = make_request('POST', '/beds', bed_data, headers)
    if not response or response.status_code != 200:
        print(f"❌ POST bed failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False
        
    bed_result = response.json()
    if 'bedId' in bed_result:
        bed_id = bed_result['bedId']
        print(f"✅ Bed created successfully")
        print(f"   🛏️ Bed ID: {bed_id}")
        print(f"   🔢 Bed Number: {bed_data['bedNumber']}")
    else:
        print(f"❌ Bed creation response missing bedId: {bed_result}")
        return False
    
    # Test GET beds to verify availability
    response = make_request('GET', '/beds', headers=headers)
    if response and response.status_code == 200:
        beds = response.json()
        created_bed = next((bed for bed in beds if bed['bedId'] == bed_id), None)
        if created_bed and not created_bed['isOccupied']:
            print(f"✅ Bed verification successful - Bed available (isOccupied: {created_bed['isOccupied']})")
            return True
        else:
            print(f"❌ Bed not found or already occupied: {created_bed}")
            return False
    else:
        print(f"❌ GET beds failed")
        return False

def test_manager_creation():
    """Test 4: Manager Creation API"""
    global manager_id
    
    print("\n👨‍💼 Testing Manager Creation...")
    
    if not auth_token or not branch_id:
        print("❌ Missing auth token or branch ID")
        return False
        
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Generate unique mobile number
    manager_mobile = f"888888{str(uuid.uuid4().int)[:4]}"
    
    # Test POST manager creation
    manager_data = {
        "name": "John Manager",
        "mobile": manager_mobile,
        "branchId": branch_id
    }
    
    response = make_request('POST', '/managers', manager_data, headers)
    if not response or response.status_code != 200:
        print(f"❌ POST manager failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False
        
    manager_result = response.json()
    if 'userId' in manager_result:
        manager_id = manager_result['userId']
        print(f"✅ Manager created successfully")
        print(f"   👤 Manager ID: {manager_id}")
        print(f"   📱 Mobile: {manager_data['mobile']}")
        print(f"   🏢 Branch: {branch_id}")
    else:
        print(f"❌ Manager creation response missing userId: {manager_result}")
        return False
    
    # Test manager login (password should be last 4 digits of mobile)
    manager_login = {
        "mobile": manager_mobile,
        "password": manager_mobile[-4:],  # Last 4 digits
        "role": "MANAGER"
    }
    
    response = make_request('POST', '/auth/login', manager_login)
    if response and response.status_code == 200:
        login_data = response.json()
        if 'token' in login_data:
            print(f"✅ Manager login successful")
            print(f"   🔑 Manager can authenticate with auto-generated password")
            return True
        else:
            print(f"❌ Manager login missing token: {login_data}")
            return False
    else:
        print(f"❌ Manager login failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False

def test_tenant_lifecycle():
    """Test 5: Tenant Lifecycle - CRITICAL FOR SYNCHRONIZATION"""
    global tenant_id
    
    print("\n🏠 Testing Tenant Lifecycle (CRITICAL)...")
    
    if not auth_token or not branch_id or not room_id or not bed_id:
        print("❌ Missing required IDs")
        print(f"   Auth token: {'✓' if auth_token else '✗'}")
        print(f"   Branch ID: {'✓' if branch_id else '✗'}")
        print(f"   Room ID: {'✓' if room_id else '✗'}")
        print(f"   Bed ID: {'✓' if bed_id else '✗'}")
        return False
        
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # First verify bed is available
    response = make_request('GET', '/beds', headers=headers)
    if response and response.status_code == 200:
        beds = response.json()
        target_bed = next((bed for bed in beds if bed['bedId'] == bed_id), None)
        if not target_bed:
            print(f"❌ Target bed not found")
            return False
        print(f"   📊 Bed status before tenant: isOccupied = {target_bed['isOccupied']}")
    
    # Generate unique mobile number
    tenant_mobile = f"777777{str(uuid.uuid4().int)[:4]}"
    
    # Test POST tenant creation
    tenant_data = {
        "name": "Raj Kumar",
        "mobile": tenant_mobile,
        "branchId": branch_id,
        "roomId": room_id,
        "bedId": bed_id,
        "joinDate": "2024-01-15",
        "monthlyRent": 8000,
        "advanceAmount": 5000,
        "refundableDeposit": 10000,
        "nonRefundableDeposit": 2000
    }
    
    response = make_request('POST', '/tenants', tenant_data, headers)
    if not response or response.status_code != 200:
        print(f"❌ POST tenant failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False
        
    tenant_result = response.json()
    if 'tenantId' in tenant_result:
        tenant_id = tenant_result['tenantId']
        print(f"✅ Tenant created successfully")
        print(f"   👤 Tenant ID: {tenant_id}")
        print(f"   📱 Mobile: {tenant_data['mobile']}")
        print(f"   💰 Monthly Rent: ₹{tenant_data['monthlyRent']}")
    else:
        print(f"❌ Tenant creation response missing tenantId: {tenant_result}")
        return False
    
    # Test tenant user account creation
    tenant_login = {
        "mobile": tenant_mobile,
        "password": tenant_mobile[-4:],  # Last 4 digits
        "role": "TENANT"
    }
    
    response = make_request('POST', '/auth/login', tenant_login)
    if not response or response.status_code != 200:
        print(f"❌ Tenant login failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False
    
    tenant_auth = response.json()
    if 'token' in tenant_auth:
        print(f"✅ Tenant user account created and can login")
    else:
        print(f"❌ Tenant login missing token: {tenant_auth}")
        return False
    
    # Test bed occupancy update (CRITICAL SYNCHRONIZATION CHECK)
    response = make_request('GET', '/beds', headers=headers)
    if response and response.status_code == 200:
        beds = response.json()
        updated_bed = next((bed for bed in beds if bed['bedId'] == bed_id), None)
        if updated_bed and updated_bed['isOccupied']:
            print(f"✅ CRITICAL: Bed occupancy updated successfully")
            print(f"   📊 Bed status after tenant: isOccupied = {updated_bed['isOccupied']}")
            print(f"   👤 Current tenant: {updated_bed.get('currentTenantId', 'Not set')}")
        else:
            print(f"❌ CRITICAL: Bed occupancy NOT updated - SYNCHRONIZATION FAILURE")
            print(f"   📊 Bed status: {updated_bed}")
            return False
    else:
        print(f"❌ Failed to verify bed status")
        return False
    
    # Test GET tenants
    response = make_request('GET', '/tenants', headers=headers)
    if response and response.status_code == 200:
        tenants = response.json()
        created_tenant = next((tenant for tenant in tenants if tenant['tenantId'] == tenant_id), None)
        if created_tenant:
            print(f"✅ Tenant appears in tenant list")
            print(f"   💰 Total Paid: ₹{created_tenant.get('totalPaid', 0)}")
            return True
        else:
            print(f"❌ Tenant not found in tenant list")
            return False
    else:
        print(f"❌ GET tenants failed")
        return False

def test_dashboard_synchronization():
    """Test 6: Dashboard Synchronization - Verify all changes reflect"""
    
    print("\n📊 Testing Dashboard Synchronization...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
        
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test admin dashboard
    response = make_request('GET', '/dashboard/admin', headers=headers)
    if not response or response.status_code != 200:
        print(f"❌ GET admin dashboard failed: {response.status_code if response else 'No response'}")
        return False
    
    dashboard = response.json()
    stats = dashboard.get('stats', {})
    
    print(f"✅ Admin dashboard retrieved successfully")
    print(f"   🏢 Total Branches: {stats.get('totalBranches', 0)}")
    print(f"   👥 Total Tenants: {stats.get('totalTenants', 0)}")
    print(f"   🛏️ Total Beds: {stats.get('totalBeds', 0)}")
    print(f"   🔴 Occupied Beds: {stats.get('occupiedBeds', 0)}")
    print(f"   🟢 Available Beds: {stats.get('availableBeds', 0)}")
    print(f"   💰 Revenue: ₹{stats.get('revenue', 0)}")
    print(f"   💸 Expenses: ₹{stats.get('expenses', 0)}")
    
    # Verify expected values based on our test data
    success = True
    
    if stats.get('totalBranches', 0) < 1:
        print(f"❌ Expected at least 1 branch, got {stats.get('totalBranches', 0)}")
        success = False
    
    # Only check tenant and bed counts if we successfully created a tenant
    if tenant_id:
        if stats.get('totalTenants', 0) < 1:
            print(f"❌ Expected at least 1 tenant, got {stats.get('totalTenants', 0)}")
            success = False
        
        if stats.get('occupiedBeds', 0) < 1:
            print(f"❌ Expected at least 1 occupied bed, got {stats.get('occupiedBeds', 0)}")
            success = False
    else:
        print(f"ℹ️  Skipping tenant/bed count verification (no tenant created)")
    
    if success:
        print(f"✅ Dashboard synchronization working correctly")
        return True
    else:
        print(f"❌ Dashboard synchronization issues found")
        return False

def test_payment_recording():
    """Test 7: Payment Recording API"""
    global payment_id
    
    print("\n💰 Testing Payment Recording...")
    
    if not auth_token or not tenant_id:
        print("❌ Missing auth token or tenant ID")
        return False
        
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Get tenant's initial totalPaid
    response = make_request('GET', '/tenants', headers=headers)
    if not response or response.status_code != 200:
        print(f"❌ Failed to get tenant data")
        return False
        
    tenants = response.json()
    tenant = next((t for t in tenants if t['tenantId'] == tenant_id), None)
    if not tenant:
        print(f"❌ Tenant not found")
        return False
        
    initial_paid = tenant.get('totalPaid', 0)
    print(f"   💰 Initial total paid: ₹{initial_paid}")
    
    # Test POST payment
    payment_data = {
        "tenantId": tenant_id,
        "amount": 8000,
        "paymentDate": "2024-01-20",
        "paymentMode": "CASH",
        "month": "JANUARY",
        "year": 2024,
        "remarks": "Monthly rent payment"
    }
    
    response = make_request('POST', '/payments', payment_data, headers)
    if not response or response.status_code != 200:
        print(f"❌ POST payment failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Error details: {response.text}")
        return False
        
    payment_result = response.json()
    if 'paymentId' in payment_result:
        payment_id = payment_result['paymentId']
        print(f"✅ Payment recorded successfully")
        print(f"   💳 Payment ID: {payment_id}")
        print(f"   💰 Amount: ₹{payment_data['amount']}")
    else:
        print(f"❌ Payment response missing paymentId: {payment_result}")
        return False
    
    # Test GET payments
    response = make_request('GET', '/payments', headers=headers)
    if not response or response.status_code != 200:
        print(f"❌ GET payments failed")
        return False
        
    payments = response.json()
    created_payment = next((p for p in payments if p['paymentId'] == payment_id), None)
    if not created_payment:
        print(f"❌ Payment not found in payment list")
        return False
        
    print(f"✅ Payment appears in payment history")
    
    # Verify tenant totalPaid was updated
    response = make_request('GET', '/tenants', headers=headers)
    if response and response.status_code == 200:
        tenants = response.json()
        updated_tenant = next((t for t in tenants if t['tenantId'] == tenant_id), None)
        if updated_tenant:
            updated_paid = updated_tenant.get('totalPaid', 0)
            expected_paid = initial_paid + payment_data['amount']
            
            print(f"   💰 Updated total paid: ₹{updated_paid}")
            
            if updated_paid == expected_paid:
                print(f"✅ CRITICAL: Tenant totalPaid updated correctly")
                return True
            else:
                print(f"❌ CRITICAL: Tenant totalPaid incorrect - Expected ₹{expected_paid}, got ₹{updated_paid}")
                return False
    
    print(f"❌ Failed to verify tenant totalPaid update")
    return False

def run_all_tests():
    """Run all backend tests in sequence"""
    print("🚀 Starting Hostel ERP Backend API Test Suite")
    print("=" * 60)
    
    tests = [
        ("Authentication", test_authentication),
        ("Branch Management", test_branch_management),
        ("Room & Bed Management", test_room_and_bed_management),
        ("Manager Creation", test_manager_creation),
        ("Tenant Lifecycle (CRITICAL)", test_tenant_lifecycle),
        ("Dashboard Synchronization", test_dashboard_synchronization),
        ("Payment Recording", test_payment_recording)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if result:
                passed += 1
                print(f"✅ {test_name}: PASSED")
            else:
                failed += 1
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            failed += 1
            print(f"❌ {test_name}: FAILED with exception: {e}")
    
    print("\n" + "=" * 60)
    print(f"🏁 TEST SUMMARY")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {passed + failed}")
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        return True
    else:
        print(f"\n⚠️ {failed} test(s) failed. Backend API has issues.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)