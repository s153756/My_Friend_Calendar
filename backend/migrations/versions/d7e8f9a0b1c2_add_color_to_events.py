"""Add color column to events

Revision ID: d7e8f9a0b1c2
Revises: a1b2c3d4e5f6
Create Date: 2026-01-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd7e8f9a0b1c2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('events', sa.Column('color', sa.String(length=20), nullable=True))


def downgrade():
    op.drop_column('events', 'color')
