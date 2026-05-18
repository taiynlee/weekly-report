"""add_schedule_tasks

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-18 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'schedule_tasks',
        sa.Column('id',          sa.Integer(),   nullable=False),
        sa.Column('year',        sa.Integer(),   nullable=False),
        sa.Column('kpi_number',  sa.Integer(),   nullable=False),
        sa.Column('title',       sa.String(300), nullable=False),
        sa.Column('start_date',  sa.Date(),      nullable=False),
        sa.Column('end_date',    sa.Date(),      nullable=False),
        sa.Column('color',       sa.String(20),  nullable=True),
        sa.Column('order_index', sa.Integer(),   nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_schedule_tasks_year', 'schedule_tasks', ['year'])


def downgrade() -> None:
    op.drop_index('ix_schedule_tasks_year', table_name='schedule_tasks')
    op.drop_table('schedule_tasks')
