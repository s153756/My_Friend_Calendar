"""Add status column to events

Revision ID: e3f4a5b6c7d8
Revises: d7e8f9a0b1c2
Create Date: 2026-01-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'e3f4a5b6c7d8'
down_revision = 'd7e8f9a0b1c2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('events', sa.Column('status', sa.String(length=20), nullable=True))


def downgrade():
    op.drop_column('events', 'status')
