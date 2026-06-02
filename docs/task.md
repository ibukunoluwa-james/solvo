# Solvo Backend — Task Tracker

## Foundation
- [x] `requirements.txt`
- [x] `.env.example`
- [x] `docker-compose.yml`

## App Core
- [x] `app/config.py`
- [x] `app/database.py`

## Models
- [x] `app/models/__init__.py`
- [x] `app/models/user.py`
- [x] `app/models/company.py`
- [x] `app/models/employee.py`
- [x] `app/models/payroll.py`
- [x] `app/models/advance.py`
- [x] `app/models/tax_remittance.py`

## Alembic
- [x] `alembic.ini` + `alembic/env.py`
- [x] Initial migration

## Schemas
- [x] `app/schemas/auth.py`
- [x] `app/schemas/company.py`
- [x] `app/schemas/employee.py`
- [x] `app/schemas/payroll.py`
- [x] `app/schemas/advance.py`

## Services
- [x] `app/services/tax_engine.py`
- [x] `app/services/kora_service.py`
- [x] `app/services/payroll_service.py`
- [x] `app/services/advance_service.py`

## Dependencies & Auth
- [x] `app/dependencies.py`

## Routers
- [x] `app/routers/auth.py`
- [x] `app/routers/companies.py`
- [x] `app/routers/employees.py`
- [x] `app/routers/payroll.py`
- [x] `app/routers/advances.py`
- [x] `app/routers/compliance.py`

## App Entry Point
- [x] `app/main.py`

## Docs
- [x] `backend/README.md`
