# Database Migration Versions

This directory contains Alembic migration scripts.

## Usage

### Create a new migration
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "description of changes"

# Create empty migration
alembic revision -m "description"
```

### Apply migrations
```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade by one version
alembic upgrade +1

# Downgrade by one version
alembic downgrade -1
```

### Check current version
```bash
alembic current
```

### View migration history
```bash
alembic history
```

## Migration Naming Convention

Format: `YYYYMMDD_HHMM_<revision>_<slug>.py`

Example: `20251029_1030_abc123def456_add_refresh_token_table.py`
