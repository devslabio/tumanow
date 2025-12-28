# TumaNow Test Credentials

All test users have the password: **Pass123**

## Test Users

### 1. Super Admin
- **Email:** superadmin@tumanow.rw
- **Phone:** +250788000001
- **Password:** Pass123
- **Role:** SUPER_ADMIN
- **Access:** Full platform access

### 2. Platform Support
- **Email:** support@tumanow.rw
- **Phone:** +250788000002
- **Password:** Pass123
- **Role:** PLATFORM_SUPPORT
- **Access:** Platform support staff

### 3. Operator Admin
- **Email:** operator@tumanow.rw
- **Phone:** +250788000003
- **Password:** Pass123
- **Role:** OPERATOR_ADMIN
- **Access:** Operator administrator

### 4. Dispatcher
- **Email:** dispatcher@tumanow.rw
- **Phone:** +250788000004
- **Password:** Pass123
- **Role:** DISPATCHER
- **Access:** Order dispatcher

### 5. Driver
- **Email:** driver@tumanow.rw
- **Phone:** +250788000005
- **Password:** Pass123
- **Role:** DRIVER
- **Access:** Delivery driver

### 6. Customer
- **Email:** customer@tumanow.rw
- **Phone:** +250788000006
- **Password:** Pass123
- **Role:** CUSTOMER
- **Access:** End customer

## Quick Login Test

You can test login with any of these credentials:

```bash
# Example: Login as Super Admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneOrEmail":"superadmin@tumanow.rw","password":"Pass123"}'
```

## Notes

- All users are active and ready to use
- All users have the domain: **@tumanow.rw**
- Password is consistent: **Pass123**
- Users can login with either email or phone number

