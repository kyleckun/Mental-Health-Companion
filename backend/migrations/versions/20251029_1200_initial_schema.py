"""Initial database schema

Revision ID: 001_initial
Revises:
Create Date: 2025-10-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Mood Entries table
    op.create_table(
        'mood_entries',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('mood_score', sa.Integer(), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('tags', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('mood_score >= 1 AND mood_score <= 10', name='check_mood_score_range')
    )
    op.create_index(op.f('ix_mood_entries_id'), 'mood_entries', ['id'], unique=False)
    op.create_index(op.f('ix_mood_entries_user_id'), 'mood_entries', ['user_id'], unique=False)
    op.create_index(op.f('ix_mood_entries_timestamp'), 'mood_entries', ['timestamp'], unique=False)
    op.create_index('idx_user_timestamp', 'mood_entries', ['user_id', 'timestamp'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_user_timestamp', table_name='mood_entries')
    op.drop_index(op.f('ix_mood_entries_timestamp'), table_name='mood_entries')
    op.drop_index(op.f('ix_mood_entries_user_id'), table_name='mood_entries')
    op.drop_index(op.f('ix_mood_entries_id'), table_name='mood_entries')
    op.drop_table('mood_entries')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
