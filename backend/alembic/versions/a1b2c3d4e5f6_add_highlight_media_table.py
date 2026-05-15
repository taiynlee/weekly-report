"""add_highlight_media_table

Revision ID: a1b2c3d4e5f6
Revises: 28f0ebd97beb
Create Date: 2026-05-15 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '28f0ebd97beb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'highlight_media',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('highlight_id', sa.Integer(), sa.ForeignKey('highlights.id'), nullable=False),
        sa.Column('media_type', sa.String(10), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
    )

    # migrate existing image_path / video_path into the new table
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, image_path, video_path FROM highlights")).fetchall()
    for row in rows:
        if row[1]:
            conn.execute(sa.text(
                "INSERT INTO highlight_media (highlight_id, media_type, url, order_index)"
                " VALUES (:hid, 'image', :url, 0)"
            ), {"hid": row[0], "url": row[1]})
        if row[2]:
            conn.execute(sa.text(
                "INSERT INTO highlight_media (highlight_id, media_type, url, order_index)"
                " VALUES (:hid, 'video', :url, 0)"
            ), {"hid": row[0], "url": row[2]})

    with op.batch_alter_table('highlights') as batch_op:
        batch_op.drop_column('image_path')
        batch_op.drop_column('video_path')


def downgrade() -> None:
    with op.batch_alter_table('highlights') as batch_op:
        batch_op.add_column(sa.Column('image_path', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('video_path', sa.Text(), nullable=True))

    op.drop_table('highlight_media')
