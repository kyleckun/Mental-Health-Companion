"""Add user_type field to users table

Revision ID: 003_add_user_type
Revises: 002_add_refresh_tokens
Create Date: 2025-10-31 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_add_user_type'
down_revision = '002_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add user_type column to users table with default value 'general'
    op.add_column('users', sa.Column('user_type', sa.String(), nullable=False, server_default='general'))


def downgrade() -> None:
    # Remove user_type column from users table
    op.drop_column('users', 'user_type')
