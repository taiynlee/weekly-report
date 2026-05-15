"""migrate_link_to_media

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-15 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, link FROM highlights WHERE link IS NOT NULL")).fetchall()
    for row in rows:
        conn.execute(sa.text(
            "INSERT INTO highlight_media (highlight_id, media_type, url, order_index)"
            " VALUES (:hid, 'link', :url, 0)"
        ), {"hid": row[0], "url": row[1]})

    with op.batch_alter_table('highlights') as batch_op:
        batch_op.drop_column('link')


def downgrade() -> None:
    with op.batch_alter_table('highlights') as batch_op:
        batch_op.add_column(sa.Column('link', sa.Text(), nullable=True))
    op.get_bind().execute(sa.text("DELETE FROM highlight_media WHERE media_type = 'link'"))
