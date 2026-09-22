"""Add credit_limit to accounts table

Revision ID: 006_add_credit_limit
Revises: 005_add_destination_account
Create Date: 2026-09-22 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006_add_credit_limit'
down_revision: Union[str, None] = '005_add_destination_account'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'accounts',
        sa.Column('credit_limit', sa.Numeric(precision=18, scale=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('accounts', 'credit_limit')
