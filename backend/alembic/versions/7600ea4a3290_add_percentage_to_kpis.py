"""add_percentage_to_kpis

Revision ID: 7600ea4a3290
Revises: e2f3a4b5c6d7
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa

revision = '7600ea4a3290'
down_revision = 'e2f3a4b5c6d7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('kpis', sa.Column('percentage', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('kpis', 'percentage')
