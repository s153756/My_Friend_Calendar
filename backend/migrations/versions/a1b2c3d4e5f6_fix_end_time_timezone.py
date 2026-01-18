"""Fix end_time column to timestamp without timezone

Revision ID: a1b2c3d4e5f6
Revises: fa3331860233
Create Date: 2026-01-15 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = 'af66cac59ca7'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('events', 'end_time',
                    existing_type=sa.DateTime(timezone=True),
                    type_=sa.DateTime(),
                    existing_nullable=False)


def downgrade():
    op.alter_column('events', 'end_time',
                    existing_type=sa.DateTime(),
                    type_=sa.DateTime(timezone=True),
                    existing_nullable=False)
