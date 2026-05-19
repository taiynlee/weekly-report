"""add sub_kpi_item_segments

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = 'e2f3a4b5c6d7'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sub_kpi_item_segments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('item_id', sa.Integer(),
                  sa.ForeignKey('sub_kpi_items.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('order_index', sa.Integer(), default=0),
    )

    # Migrate existing start_date/end_date into segments
    conn = op.get_bind()
    conn.execute(text("""
        INSERT INTO sub_kpi_item_segments (item_id, start_date, end_date, order_index)
        SELECT id, start_date, end_date, 0
        FROM sub_kpi_items
        WHERE start_date IS NOT NULL AND end_date IS NOT NULL
    """))


def downgrade():
    op.drop_table('sub_kpi_item_segments')
