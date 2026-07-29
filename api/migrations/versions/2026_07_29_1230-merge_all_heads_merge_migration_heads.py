"""merge all migration heads

Revision ID: merge_all_heads
Revises: 2a3aebbbf4bb, 68519ad5cd18, a1b2c3d4e5f6, a91b476a53de, b69ca54b9208
Create Date: 2026-07-29 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_all_heads'
down_revision = ('2a3aebbbf4bb', '68519ad5cd18', 'a1b2c3d4e5f6', 'a91b476a53de', 'b69ca54b9208')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
