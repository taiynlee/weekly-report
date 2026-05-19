"""add dates to sub_kpi_items

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('sub_kpi_items', sa.Column('start_date', sa.Date(), nullable=True))
    op.add_column('sub_kpi_items', sa.Column('end_date', sa.Date(), nullable=True))


def downgrade():
    op.drop_column('sub_kpi_items', 'end_date')
    op.drop_column('sub_kpi_items', 'start_date')
